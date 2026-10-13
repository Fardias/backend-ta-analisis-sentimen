function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    responseStatus: true,
    responseMessage: message,
    responseData: data
  });
}

function errorResponse(res, message = 'Error', statusCode = 500, data = null) {
  return res.status(statusCode).json({
    responseStatus: false,
    responseMessage: message,
    responseData: data
  });
}

module.exports = {
  successResponse,
  errorResponse
};
