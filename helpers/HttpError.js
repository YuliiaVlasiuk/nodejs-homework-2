
const errorMessageList={
  400:"Bad Request",
  401:"Unauthorized",
  403:"Forbidded",
  404:"Not Found",
  409:"Conflict"
}




const HttpError = (status, message=errorMessageList[status]) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

module.exports = HttpError;
