function formatTokens(tokenString) {
    try{
            // Check if tokenString is null
    if (tokenString === null) {
        return [];
    }
    // Remove leading and trailing brackets from the string
    let cleanedString = tokenString.substring(1, tokenString.length - 1);
    // Split the string by comma to get an array of values
    let tokenArray = cleanedString.split(',');
    // Trim each value in the array to remove any leading or trailing single quotes and escaped double quotes
    tokenArray = tokenArray.map(token => token.trim().replace(/^'|"|'$|"$/g, ''));
    return tokenArray;
    }
    catch(error){
        return [];
    }
}

module.exports = {
    formatTokens: formatTokens
};
