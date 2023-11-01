const Force = require("../lib/force");
const fs = require('fs');
const Tooling = require("../lib/force/tooling");
var isXmlFileExist = false;
var xml2js = require('xml2js');
const QueryFilter = require("../lib/query/queryFilter");
const  client = new Force(
    process.env.npm_config_loginurl
);
var existingTestClasses = [];

const splitArrayIntoChunksOf50 = (classNames) => {
    let chunkedArray = [];
    let chunkIndex = 0;
    let i = 0;
    const CHUNK_SIZE = 50;
    while(i + CHUNK_SIZE*chunkIndex  <classNames.length ){
        let chunk = [];
        while(i <CHUNK_SIZE  ){
            chunk.push(classNames[i + CHUNK_SIZE*chunkIndex ]);
            i++;
            if(i + CHUNK_SIZE*chunkIndex  == classNames.length){
                break;
            }
        }
        if(chunk.length>0){
            chunkedArray[chunkIndex] = Array.from(chunk);
        }
        // console.log("\n chunkedArray.item " +  chunkIndex + " = " + chunkedArray[chunkIndex])
        chunkIndex++;
        i = 0;
    }
    return chunkedArray;
}
const getClassIdsFromClassNames2 = async (client,classnames)=> {
    const allResults = [];
    const results = [];
    const chunkedArray = splitArrayIntoChunksOf50(classnames);
    for(let i = 0; i < chunkedArray.length; i++) {
        allResults.push(
            ...(
                await client.Tooling.findSObjects(
                    "ApexClass",
                    ["Id"],
                    new QueryFilter().addInClause("Name", chunkedArray[i]),
                    "Name"
                )
            )
        );
    }
    let i = 0;
    while( i < allResults.length ){
        results.push( "\"" +allResults[i].Id + "\"" );
        i++;
    }
    
    return results;
}
/**
 * @param {Force} client
 * @param {string[]} classNames
 * @returns {Promise<string[]>}
 */
const getClassIdsFromClassNames = async (client, classNames) => {
    const apexClassRecords = await client.Tooling.findSObjects(
        "ApexClass",
        "Id",
        new QueryFilter().addInClause("Name", classNames),
        "Name"
    );
    let recordCount = apexClassRecords.length;
    const classRecordIds = [];
    if(recordCount > 0) {
        //@todo Maybe warn if some classes could not be found?
        for(let i = 0; i < recordCount; i++) {
            classRecordIds.push(apexClassRecords[i].Id);
        }
    }
    return classRecordIds;
}

/**
 * @param {Force} client
 * @param {string[]} classIds
 * @return {Promise<Map<string,string>>}
 */
const getReferencingClassIds = async (client, classIds) => {
    const dependencyRecords = await client.Tooling.findSObjectsNonRecursive(
        "MetadataComponentDependency",
        "MetadataComponentId, MetadataComponentName",
        new QueryFilter()
            .addInClause("RefMetadataComponentId", classIds)
            .addEqualsClause("MetadataComponentType", "ApexClass"),
        "MetadataComponentId"
    );
    const dependentClassRecords = new Map();
    for(let i = 0, j = dependencyRecords.length; i < j; i++) {
        const record = dependencyRecords[i];
        dependentClassRecords.set(
            record.MetadataComponentId,
            record.MetadataComponentName
        );
    }
    return dependentClassRecords;
}

/**
 * 
 * @param {Map<string,string>} dependencedClassNames 
 * @param {string } csvFilePath 
 * @returns {Promise<string>}
 */
const saveTestClassNames2File = async (dependencedClassNames,csvFilePath,deployOption) => {
    let siblingTestClassArray = [];
    let outputContent = "";
    // lookup in full changed apex class list to get associated test class
    if (dependencedClassNames!= null){
        for (let className of dependencedClassNames.values()){
            if(className.includes('Test')){
                siblingTestClassArray.push(className);
            }
        }
        outputContent = ""+  siblingTestClassArray.join(",");
        console.log('outputCOntent1 = ' +outputContent.length );
    }else{
        outputContent = deployOption;
        console.log('outputCOntent2 = ' +outputContent );
    }
    var  file = fs.createWriteStream(csvFilePath);
    file.write(outputContent);
    file.on('error', function(err) {  /* error handling */ 
            // console.error('There is an error writing the file ${csvFileOut} => ${err}')
        });
    file.on('finish', () => {
            // console.log('wrote all the array data to file ${csvFileOut} with content : ' + siblingTestClassArray.join(","));
            });
    file.end();
}


const saveTestClassNames2File2 = async (dependencedClassNamesArray,csvFilePath,deployOption) => {
    let siblingTestClassArray = [];
    let outputContent = "";
    // lookup in full changed apex class list to get associated test class
    if (dependencedClassNamesArray!= null){
        for (let className of dependencedClassNamesArray){
            if(className.includes('Test')){
                siblingTestClassArray.push(className);
            }
        }
        outputContent = ""+  siblingTestClassArray.join(",");
        console.log('outputCOntent1 = ' +outputContent.length );
    }else{
        outputContent = deployOption;
        console.log('outputCOntent2 = ' +outputContent );
    }
    var  file = fs.createWriteStream(csvFilePath);
    file.write(outputContent);
    file.on('error', function(err) {  /* error handling */ 
            // console.error('There is an error writing the file ${csvFileOut} => ${err}')
        });
    file.on('finish', () => {
            // console.log('wrote all the array data to file ${csvFileOut} with content : ' + siblingTestClassArray.join(","));
            });
    file.end();
}

/**
 * 
 * @param {*} packageXMLFilePath 
 * @returns array of strings
 */
const getApexClassNames = async (packageXMLFilePath) => {
    // store all apex class names defined in package.xml file
    var changeFileNames = [];
    var siblingTestClassArray = [];
    
    var extractedData = "";
    var parser = new xml2js.Parser();
    var xml = fs.readFileSync(packageXMLFilePath, "utf8");

    addInjectMetadataToPackageXML(packageXMLFilePath);

    // read delta XML File to get list of change apex file names
    parser.parseString(xml, function(err,result){
        if(result!= null && result.Package!= null && result.Package.types!= null) {
            if (result.Package.types.length>0){
                isXmlFileExist = true;
            }
            
            //Extract the value from the data element -- can not get text value
            for(var i=0;i<result.Package.types.length;i++){
                extractedData = result.Package.types[i].name;
                if((extractedData == 'ApexClass') ||(extractedData == 'ApexTrigger') ){
                    for(var j=0; j<result.Package.types[i].members.length; j++){
                        changeFileNames.push(result.Package.types[i].members[j]);
                        if(result.Package.types[i].members[j].includes('Test')){
                            existingTestClasses.push(result.Package.types[i].members[j]);
                        }
                    }
                }
            }
        }
    });
    // console.log('changed classes ' + changeFileNames.join(","));
    // console.log('existingTestClasses classes ' + existingTestClasses.join(","));
    return changeFileNames;
}

/**
 * 
 * @param {*} packageXMLFilePath 
 * @returns array of strings
 */
 const addInjectMetadataToPackageXML = async (packageXMLFilePath) => {
    // store all apex class names defined in package.xml file
    var experienceResourceName = 'ExperienceBundle';
    
    var nameArray = [
        'PLSPlus_NotifiableWorks',
        'PLSPlus_SIFI',
        'PLSPlus_Disputes',
        'PLSPlus_OTHER',
        'AWS_SVC',
        'AWS_SV4',
        'Declaration_S3_Bucket',
        'BPOINT_FOR_OTHERS',
        'BPOINT_FOR_LICENCING'
    ];

    var customMetadataArray = [
        'AWS_Setting.AWS_Adjudication_Upload',
        'ECM_Bulk_Declaration_Email.Bulk_ECM_Declaration',
        'Meridio_Declaration_Setting.Meridio_Declaration_Setting'
    ];

    var staticResourcesArray = [
    ];

    var remoteSiteArray = [
        'BPoint_UAT',
        'EDQ_SELF_ACCESS'
    ];

    var trustedSiteArray=['AWS'];
    var settingArray = ['Case'];
    var queueArray = ['MDT_NOOF_Brisbane'];

    var deployReourcesName = [
        { name: 'NamedCredential', fileCollection: nameArray},
        { name: 'CustomMetadata', fileCollection: customMetadataArray},
        { name: 'StaticResource', fileCollection: staticResourcesArray},
        { name: 'RemoteSiteSetting', fileCollection: remoteSiteArray},
        { name: 'CspTrustedSite', fileCollection: trustedSiteArray},
        { name: 'Settings', fileCollection: settingArray},
        { name: 'Queue', fileCollection: queueArray}
    ];

    var isExistMap = new Map([
        ['NamedCredential',false],
        ['CustomMetadata', false],
        ['StaticResource', false],
        ['RemoteSiteSetting', false],
        ['CspTrustedSite', false],
        ['Settings', false]
    ]);

    var extractedData = "";
    var parser = new xml2js.Parser();
    var xml = fs.readFileSync(packageXMLFilePath, "utf8");

    // read delta XML File to get list of change apex file names
    var isContentChange = false;
    parser.parseString(xml, function(err,result){
        if(result!= null && result.Package!= null && result.Package.types!= null) {
            //parse package.xml file add more resources need to deploy ad default if any of it available to deploy
            for(var i=0;i<result.Package.types.length;i++){
                extractedData = result.Package.types[i].name;
                for( var k=0; k<deployReourcesName.length; k++){
                    var resourceItem = deployReourcesName[k];
                    if(extractedData == resourceItem.name){
                        for(var j=0; j<resourceItem.fileCollection.length; j++){
                            result.Package.types[i].members.push(resourceItem.fileCollection[j]);
                            isContentChange =true;
                        } 
                        isExistMap[resourceItem.name] = true;
                    }
                }
            }

            // remove experience bundle as default
            for(var i=0;i<result.Package.types.length;i++){
                extractedData = result.Package.types[i].name;
                if(extractedData == experienceResourceName){
                    result.Package.types.splice(i,1);
                    break ;
                }
            }

            // if the resource had not been change and pickup by delta process, then need to add resource name and values
            for (const [key, value] of isExistMap) {
                if (!value){
                    for( var k=0; k<deployReourcesName.length; k++){
                        var resourceItem = deployReourcesName[k];
                        if(key == resourceItem.name){
                            var newItem = {members:[], name: key};
                            for(var j=0; j<resourceItem.fileCollection.length; j++){
                                newItem.members.push(resourceItem.fileCollection[j]);
                            }
                            result.Package.types.push(newItem);
                            isContentChange =true;
                        }
                    }
                }
            }

            // if there is any change on content, the package.xml file will be rewritten
            if (isContentChange ){
                const builder = new xml2js.Builder();
                xml = builder.buildObject(result);
                // write updated XML string to a file
                fs.writeFile(packageXMLFilePath, xml, (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`Updated XML is written to a new file.`);
                });
            }
        }
    });
}

const pass = process.env.SF_DEPLOY_PWD + process.env.SF_DEPLOY_TOKEN;
console.log(pass, pass.length)
client.login(
    process.env.npm_config_username,
    process.env.SF_DEPLOY_PWD + process.env.SF_DEPLOY_TOKEN
).then(async () => {

    // the argument form env is always in lowcase , otherwise unidentified will receive
    let csvTestClassesFilePath = process.env.npm_config_outputfilename //'output/allTestClasses.csv';
    let packageXMLFilePath = process.env.npm_config_xmlfilename // 'package/package.xml';
   
    // get apex class and trigger from package.xml file
    const inputClassNames = await getApexClassNames(packageXMLFilePath);

    var dependentClassNameArray = [];
    const chunkedArray = splitArrayIntoChunksOf50(inputClassNames);
    for(let i = 0; i < chunkedArray.length; i++) {
        let classNames = chunkedArray[i];
        if(classNames.length >0 ){
            const classIds = await getClassIdsFromClassNames(client, classNames);
            if(classIds.length > 0) {
                const dependentClassIdToName1 = await getReferencingClassIds(client, classIds)
                
                // // Two level, add dependencies in level 1 to original class list
                let dependentClassIds = dependentClassIdToName1.keys();
                let result = dependentClassIds.next();
                while( !result.done ) {
                    classIds.push(result.value);
                    result = dependentClassIds.next();
                }
                const dependentClassIdToName2 = await getReferencingClassIds(
                    client,
                    classIds
                );
                // concate the outcome map and pass to write2File
                let dependentClassIdToNameValue= dependentClassIdToName2.values();
                result = dependentClassIdToNameValue.next();
                while( !result.done ) {
                    dependentClassNameArray.push(result.value);
                    result = dependentClassIdToNameValue.next();
                }
            }
        }
    }
    // add existing test classes to the outcome
    dependentClassNameArray = dependentClassNameArray.concat(existingTestClasses);

    // logout sibling test classes to file
    console.log('result length = ' + dependentClassNameArray.length);
    const dependentTestClasses = await saveTestClassNames2File2(
        dependentClassNameArray,
        csvTestClassesFilePath,
        "1"
    );
    console.info('console 1');
    
}).catch(ex => {
    console.error(ex);
}).finally(async () => {
    await client.logout();
});
