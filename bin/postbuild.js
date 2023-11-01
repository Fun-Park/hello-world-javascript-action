const fs = require('fs');
const Tooling = require("../lib/force/tooling");
const replace = require('replace-in-file');
var xml2js = require('xml2js');

// store all apex class names defined in package.xml file
var packageXMLFilePath = process.env.npm_config_xmlFileName


var inactivateResourcesName= new Map([
    ['triggers', './Salesforce/force-app/main/default/triggers/*.*-meta.xml']]);

var inactivateFlowName= new Map([
        ['flows', './Salesforce/force-app/main/default/flowDefinitions/*.*-meta.xml']]);

var validationRuleName= new Map([
    ['workflows', './Salesforce/force-app/main/default/workflows/*.*-meta.xml'],
    ['validationRulesAccount', './Salesforce/force-app/main/default/objects/Account/validationRules/*.*-meta.xml'],
    ['validationRulesCase','./Salesforce/force-app/main/default/objects/Case/validationRules/*.*-meta.xml'],
    ['validationRulesClaimsApprovals', './Salesforce/force-app/main/default/objects/Claim_Approvals__/validationRules/*.*-meta.xml'],
    ['validationRulesClaimsSummary', './Salesforce/force-app/main/default/objects/Claims_Summary__c/validationRules/*.*-meta.xml'],
    ['validationRulesNameHistory', './Salesforce/force-app/main/default/objects/Name_History__c/validationRules/*.*-meta.xml'],
    ['validationRulesPolicy', './Salesforce/force-app/main/default/objects/Policy__c/validationRules/*.*-meta.xml'],
    ['validationRulesPurchaseOrder', './Salesforce/force-app/main/default/objects/Purchase_Order__c/validationRules/*.*-meta.xml'],
    ['validationRulesContact', './Salesforce/force-app/main/default/objects/Contact/validationRules/*.*-meta.xml'],
    ['validationRulesPolicy', './Salesforce/force-app/main/default/objects/Policy__c/validationRules/*.*-meta.xml'],
    ['validationRulesQ&Akav', './Salesforce/force-app/main/default/objects/QandA__kav/validationRules/*.*-meta.xml'],
    ['validationRulesQuote', './Salesforce/force-app/main/default/objects/Quote__c/validationRules/*.*-meta.xml'],
    ['validationRulesSchedule', './Salesforce/force-app/main/default/objects/Schedule__c/validationRules/*.*-meta.xml'],
    ['validationRulesScopeOfWork', './Salesforce/force-app/main/default/objects/Scope_of_Work__c/validationRules/*.*-meta.xml'],
    ['validationRulesWorkInstructionkav', './Salesforce/force-app/main/default/objects/Work_Instructions__kav/validationRules/*.*-meta.xml']
])
var extractedData = "";
var parser = new xml2js.Parser();
var xml = fs.readFileSync(packageXMLFilePath, "utf8");
console.log( 'postbuild script is run');


// activate resources before deploy
console.log('Replacement is run');

// for (const [key, value] of inactivateResourcesName) {
//     const options = {
//         files: value,
//         from: '<status>Inactive</status>',
//         to: '<status>Active</status>',
//     };

//     try {
//         const results = replace.sync(options);
//         console.log('Activate Replacement results:', value);
//     }
//       catch (error) {
//         console.error('Error occurred:', error);
//     }
// }

// inactivate validation rules before deploy
console.log('Replacement is run');
for (const [key, value] of validationRuleName) {
    const options = {
        files: value,
        from: '<active>false</active>',
        to: '<active>true</active>',
    };

    try {
        const results = replace.sync(options);
        console.log('Activate Replacement results:', value);
    }
      catch (error) {
        console.error('Error occurred:', error);
    }
}
