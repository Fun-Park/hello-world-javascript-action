const fs = require('fs');

function replace(relpaceOption) {
    // load the html file
    var fileContent = fs.readFileSync(relpaceOption.filepath, relpaceOption.encoding);

    // replacePath is your match[1]
    fileContent = fileContent.replace(new RegExp(relpaceOption.regPattern), relpaceOption.replaceVal);

    // this will overwrite the original html file, change the path for test
    fs.writeFileSync(relpaceOption.filepath, fileContent);
}
// var relpaceOption={
        // filepath:'./src/namedCredentials/MulesoftIntegration.namedCredential.xml',
        // encoding:'utf8',
        // flag:'',
        // regPattern:'<endpoint>https://.+?(?=/)',
        // replaceVal: '<endpoint>https://customer111-integration-api-alphaa.au-s1.cloudhub.io'
    // };

// var replaceOptMap = 
    // [   
        // {
            // name: "update_namedcred_endpoints",                                        
            // filepath:"./src/namedCredentials/MulesoftIntegration.namedCredential",
            // encoding:"utf8",
            // flag:"",
            // regPattern:"<endpoint>https://.+?(?=/)",
            // replaceVal: "<endpoint>https://customer1111-integration-api-alphaa.au-s1.cloudhub.io"
        // }
    // ];

// replace(replaceOptMap[0]);