const core = require('@actions/core')
const secretKeys = [/pwd/i, /secret/i, /password/i, /token/i];
const main = () => {
    try {
        // the secret value is passed from the caller - github action workflow
        const allInOneSecretValue = process.env.npm_config_allsecret;

        const secretValArray = allInOneSecretValue.split('\n')
        //build JSON from the secret value
        let json_arr = {};

        for (let i = 0; i < secretValArray.length; i++) {
            const keyValues = secretValArray[i].split("= ");
            const key = keyValues[0]?.trim() || undefined;
            const value = keyValues[1]?.trim() || undefined;
            if (key && value !== undefined) {
                // Check if the key name matches something that should be masked in the logs
                secretKeys.forEach(secretReg => {
                    if (secretReg.test(key)) {
                        core.setSecret(value);
                    }
                })
                json_arr[key] = value
                // Add the key/value to the env vars
                core.exportVariable(key, value);
            }
        }

        core.setOutput('json_var', JSON.stringify(json_arr));
    } catch (error) {
        core.setFailed(error.message);
    }
};

main();
