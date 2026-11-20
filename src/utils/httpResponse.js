const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
}

/** build a standardized API gateway LAMBDA Proxy response
 * @param {number} sattusCode
 * @param {object} body
 * @returns {object}
 */

const buildResponse = (statusCode, body) => ({
    statusCode,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(body)
});

const ok = (data) => buildResponse(200, data);

const created = (data) => buildResponse(201, data);

const badRequest = (message) =>
    buildResponse(400, {
        error: "Bad Request",
        message,
    });

const notFound = (message) =>
    buildResponse(404, {
        error: "Not Found",
        message,
    });

const serverError = (message = "Internal Server Error") =>
    buildResponse(500, {
        error: "Internal Server Error",
        message,
    });

module.exports = {
    buildResponse,
    ok,
    created,
    badRequest,
    notFound,
    serverError,
};