'use strict'

/**
 * Get unique error field name from a PostgreSQL unique_violation error
 * e.g. detail: 'Key (email)=(a@b.com) already exists.'
 */
const getUniqueErrorMessage = (err) => {
    let output
    try {
        const fieldName = /Key \((.+?)\)=/.exec(err.detail)[1]
        output = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' already exists'
    } catch (ex) {
        output = 'Unique field already exists'
    }

    return output
}

/**
 * Get the error message from error object
 */
const getErrorMessage = (err) => {
    // validation errors thrown by the models
    if (err.name === 'ValidationError') {
        return err.message
    }

    // PostgreSQL error codes
    switch (err.code) {
        case '23505': // unique_violation
            return getUniqueErrorMessage(err)
        case '23502': // not_null_violation
            return (err.column ? err.column.charAt(0).toUpperCase() + err.column.slice(1) : 'Field') + ' is required'
        case '23514': // check_violation
            return 'Invalid value provided'
        case '22P02': // invalid_text_representation
        case '22007': // invalid_datetime_format
        case '22008': // datetime_field_overflow
            return 'Invalid value provided'
        default:
            return 'Something went wrong'
    }
}

export default {getErrorMessage}
