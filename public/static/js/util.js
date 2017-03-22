/**
 * Check whether the variable is function
 *
 * @param {*} potentialFunction - The variable to check
 *
 * @returns {bool} Whether the potentialFunction is a function
 */
function isFunction(potentialFunction) {
    return potentialFunction && {}.toString.call(potentialFunction) === {}.toString.call(new Function());
}

/**
 * "Cast" variable into function
 *
 * @param {*} callback - The variable to "cast" into a function. If callback isn't a function, return new function.
 *
 * @returns {function} The callback function or new function if callback wasn't function
 */
function fn(callback) {
    return isFunction(callback) ? callback : (new Function);
}

/**
 * Call a function safely and return output
 *
 * @param {*}    func - The function to call. If func isn't a function, convert it to empty function.
 * @param {...*} args - Options or arguments to pass to function
 *
 * @returns func function output
 */
function call(func, args) {
    // Get arguments as array
    args = Array.prototype.slice.call(arguments);

    // Stay safe, kids
    func = fn(args[ 0 ]);

    // Apply arguments to (now safe) function
    return func.apply(null, args.slice(1));
}

/**
 * Capitalize first character of string
 *
 * @param {string} str - The string to convert
 *
 * @returns {string} String with uppercase first character
 */
function capitalize(str) {
    str = str || this || '';
    return (str.length < 2) ? (str.toUpperCase()) : (str.charAt(0).toUpperCase() + str.slice(1));
}

/**
 * Convert string to kebab-case
 *
 * @param {string} str - The string to convert
 *
 * @returns {string} Lowercase kebab-cased string
 */
function kebabCase(str) {
    str = str || this || '';
    return str.replace(/\s+/g, '-').toLowerCase();
}

String.prototype.capitalize  = String.prototype.capitalize || capitalize;
String.prototype.toKebabCase = String.prototype.toKebabCase || kebabCase;