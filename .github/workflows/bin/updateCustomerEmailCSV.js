const core = require('@actions/core')
require('dotenv').config()
const jsforce = require('jsforce');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


const EMAIL_POSTFIX = '.qbcc';
const CUSTOMER_SOQL_QUERY = "SELECT Id, Company_Email__c, Email_2__pc, PersonEmail " +
    "FROM Account " +
    "WHERE (Company_Email__c <> null or Email_2__pc <> null or PersonEmail <> null) " +
    "AND ((NOT PersonEmail = 'online.formuser@qbcc.qld.gov.au') " +
    "AND RecordType.DeveloperName <> 'LGA_Account' " +
    "AND (NOT Company_Email__c like '%.qbcc') AND (NOT Email_2__pc like '%.qbcc') " +
    "AND (NOT PersonEmail like '%.qbcc'))";

const CUSTOMER_FIELDS = ['Company_Email__c', 'Email_2__pc', 'PersonEmail'];

const POLICY_SOQL_QUERY = "SELECT Id, Alternative_contact_email__c,Homeowner_Email__c,Homeowner_Email_workflows__c,Licensee_Email_workflows__c,Payer_email__c " +
    "FROM Policy__c " +
    "WHERE (Alternative_contact_email__c <> NULL OR Homeowner_Email__c <> NULL OR " +
    "Homeowner_Email_workflows__c <> NULL OR Licensee_Email_workflows__c <> NULL OR Payer_email__c <> NULL) " +
    "AND ((NOT Alternative_contact_email__c LIKE '%.qbcc') AND (NOT Homeowner_Email__c = 'do_not_mail@qbcc.qld.gov.au') AND " +
    "(NOT Homeowner_Email__c LIKE '%.qbcc') AND (NOT Homeowner_Email_workflows__c LIKE '%.qbcc') AND " +
    "(NOT Licensee_Email_workflows__c LIKE '%.qbcc') AND (NOT Payer_email__c LIKE '%.qbcc'))";

const POLICY_FIELDS = ['Alternative_contact_email__c', 'Homeowner_Email__c', 'Homeowner_Email_workflows__c', 'Licensee_Email_workflows__c', 'Payer_email__c'];

const customerRecords = [];
const policyRecords = [];
const pollInterval = 5 * 1000; // 5 secs
const pollTimeout = 15 * 60 * 1000; // up to 15 mins per batch
const BATCH_SIZE = 10000;
const customerErrors = [];
const policyErrors = [];

const chunkRecords = (records) => {
    return records.reduce((resultArray, item, index) => {
        const chunkIndex = Math.floor(index / BATCH_SIZE)

        if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] // start a new chunk
        }

        resultArray[chunkIndex].push(item)

        return resultArray
    }, []);
};

const processBatch = (job, batchRecords) => {
    return new Promise(function (resolve, reject) {
        const batch = job.createBatch();
        batch.execute(batchRecords);
        // listen for events
        batch.on("error", function (batchInfo) { // fired when batch request is queued in server.
            console.error('Error, batchInfo:', batchInfo);
            reject(batchInfo);
        });
        batch.on("queue", function (batchInfo) { // fired when batch request is queued in server.
            core.info('Batch Added: ');
            core.info(JSON.stringify(batchInfo, null, 4));
            batch.poll(pollInterval /* interval(ms) */, pollTimeout /* timeout(ms) */);
            // start polling - Do not poll until the batch has started
        });
        batch.on("response", function (rets) { // fired when batch finished and result retrieved
            resolve(rets);
        });
    });
};

const outputSummary = () => {
    const errorTable = [
        [{data: 'Id', header: true}, {data: 'Object', header: true}, {data: 'Error', header: true}],
    ];
    customerErrors.forEach(err => {
        errorTable.push([err.id, 'Account', err.errors.join(', ')])
    });
    policyErrors.forEach(err => {
        errorTable.push([err.id, 'Policy__c', err.errors.join(', ')])
    });
    const env = process.env.SFENV_NAME?.toUpperCase();
    core.summary
        .addHeading(`Updated ${customerRecords.length} Customer records in ${env}`, 1)
        .addHeading(`Updated ${policyRecords.length} Policy records in ${env}`, 1)
        .addHeading("Record Update Errors", 2)
        .addTable(errorTable)
        .write();
}

const updateCustomerEmails = (conn, csvFile) => {
    return new Promise(function (resolve, reject) {
        core.info('Querying for customers to be updated: ' + CUSTOMER_SOQL_QUERY);
        conn.bulk.query(CUSTOMER_SOQL_QUERY)
            .on('record', function (rec) {
                CUSTOMER_FIELDS.forEach(field => {
                    if (rec[field]) {
                        rec[field] += EMAIL_POSTFIX;
                    }
                });

                customerRecords.push(rec)
            })
            .on('error', function (err) {
                core.setFailed(err);
                reject(err);
            })
            .on('end', () => {
                if (customerRecords) {
                    core.notice(`Found ${customerRecords.length} customer records to be updated`);
                }
                // Output a CSV of the data
                const fileHeaders = customerRecords[0] ? Object.keys(customerRecords[0]).map(col => {
                    return {id: col, title: col}
                }) : [];
                const csvWriter = createCsvWriter({
                    path: csvFile,
                    header: fileHeaders,
                });
                csvWriter.writeRecords(customerRecords)       // returns a promise
                    .then(() => {
                        core.info('CSV file written');
                        // After writing out the file process the records
                        if (customerRecords && customerRecords.length >= 1) {
                            const job = conn.bulk.createJob("Account", "update");
                            const chunkedRecords = chunkRecords(customerRecords);
                            core.info(`Updating the customers in ${chunkedRecords.length} batches`);
                            core.startGroup('Lodge Update Batches');
                            Promise.all(
                                chunkedRecords.map(batch => {
                                    return processBatch(job, batch);
                                })
                            ).then(rets => {
                                core.endGroup();
                                core.info('Checking for record update errors');
                                for (let i = 0; i < rets.length; i++) {
                                    for (let j = 0; j < rets[i].length; j++) {
                                        if (!rets[i][j].success) {
                                            console.error("#" + (j + 1) + " error occurred, message = " + rets[i][j].errors.join(', '));
                                            customerErrors.push(rets[i][j]);
                                        }
                                    }
                                }
                                resolve();
                            }).catch(error => {
                                console.error(error);
                                core.error(error);
                                reject(error);
                            }).finally(() => {
                                job.close();
                            });
                        }
                    });
            });
    });
};

const updatePolicyEmails = (conn, csvFile) => {
    return new Promise(function (resolve, reject) {
        core.info('Querying for Policies to be updated: ' + POLICY_SOQL_QUERY);
        conn.bulk.query(POLICY_SOQL_QUERY)
            .on('record', function (rec) {
                POLICY_FIELDS.forEach(field => {
                    if (rec[field]) {
                        rec[field] += EMAIL_POSTFIX;
                    }
                });

                policyRecords.push(rec)
            })
            .on('error', function (err) {
                core.setFailed(err);
                reject(err);
            })
            .on('end', () => {
                if (policyRecords) {
                    core.notice(`Found ${policyRecords.length} Policy records to be updated`);
                }
                // Output a CSV of the data
                const fileHeaders = policyRecords[0] ? Object.keys(policyRecords[0]).map(col => {
                    return {id: col, title: col}
                }) : [];
                const csvWriter = createCsvWriter({
                    path: csvFile,
                    header: fileHeaders,
                });
                csvWriter.writeRecords(policyRecords)       // returns a promise
                    .then(() => {
                        core.info('CSV file written');
                        // After writing out the file process the records
                        if (policyRecords && policyRecords.length >= 1) {
                            const job = conn.bulk.createJob("Policy__c", "update");
                            const chunkedRecords = chunkRecords(policyRecords);
                            core.info(`Updating the Policies in ${chunkedRecords.length} batches`);
                            core.startGroup('Lodge Update Batches');
                            Promise.all(
                                chunkedRecords.map(batch => {
                                    return processBatch(job, batch);
                                })
                            ).then(rets => {
                                core.endGroup();
                                core.info('Checking for record update errors');
                                for (let i = 0; i < rets.length; i++) {
                                    for (let j = 0; j < rets[i].length; j++) {
                                        if (!rets[i][j].success) {
                                            console.error("#" + (j + 1) + " error occurred, message = " + rets[i][j].errors.join(', '));
                                            policyErrors.push(rets[i][j]);
                                        }
                                    }
                                }
                                resolve();
                            }).catch(error => {
                                console.error(error);
                                core.error(error);
                                reject(error);
                            }).finally(() => {
                                job.close();
                            });
                        }
                    });
            });
    });
};

const main = async () => {
    try {
        if (/master/i.test(process.env.TARGET_BRANCH)) {
            throw new Error(`Production branch detected (${process.env.TARGET_BRANCH}), aborting`);
        }
        const customerCsvFile = process.env.npm_config_customercsvfile || 'customerData.csv';
        const policyCsvFile = process.env.npm_config_policycsvfile || 'policyData.csv';
        const loginUrl = process.env.npm_config_loginurl;
        const username = process.env.username;
        const password = process.env.password + process.env.token;

        const conn = new jsforce.Connection({
            // you can change loginUrl to connect to sandbox or prerelease env.
            loginUrl: loginUrl,
            version: 56.0,
            callOptions: {client: 'updateCustomerEmailCSV'}
        });
        await conn.login(username, password, async function (err, userInfo) {
            if (err) {
                core.setFailed(err);
                return console.error(err);
            }
            core.info('Connected to ' + conn.instanceUrl + ' as ' + username);
            // Make sure that the polling is set up for the query
            conn.bulk.pollInterval = pollInterval;
            conn.bulk.pollTimeout = pollTimeout;

            await updateCustomerEmails(conn, customerCsvFile);
            await updatePolicyEmails(conn, policyCsvFile);
            outputSummary();
        });
    } catch (error) {
        core.setFailed(error.message);
    }
};

main();