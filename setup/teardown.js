var config = require('../config'),
    rp = require('request-promise'),
    pressAnyKey = require('press-any-key'),
    colors = require('colors');

const handleError = (err) => {
  if (err.error &&
      err.error.errorResponse &&
      err.error.errorResponse.message) {
    console.log('Error: ' + err.error.errorResponse.message);
  } else {
    console.log(JSON.stringify(err, null, 2));
  }
}

const deleteForest = async (name) => {
  const options = {
    method: 'DELETE',
    uri: 'http://' + config.host + ':8002/manage/v2/forests/' + name + '?level=full',
    headers: {
      'Content-Type': 'application/json'
    },
    auth: config.auth
  };
  try {
    const response = await rp(options);
    console.log('Forest deleted: '.green + name);
  } catch (error) {
    handleError(error);
  }
}

const deleteDatabase = async (name) => {
  const options = {
    method: 'DELETE',
    uri: 'http://' + config.host + ':8002/manage/v2/databases/' + name + '?forest-delete=data',
    headers: {
      'Content-Type': 'application/json'
    },
    auth: config.auth
  };
  try {
    const response = await rp(options);
    console.log('Database deleted: '.green + name);
  } catch (error) {
    handleError(error);
  }
}

const clearDatabase = async (name) => {
  const operation = {"operation": "clear-database"};
  const options = {
    method: 'POST',
    uri: 'http://' + config.host + ':8002/manage/v2/databases/' + name,
    headers: {
      'Content-Type': 'application/json'
    },
    auth: config.auth
  };
  try {
    const response = await rp(options);
    console.log('Database cleared: '.green + name);
  } catch (error) {
    handleError(error);
  }
}

const deleteREST = async (name) => {
  const options = {
    method: 'DELETE',
    uri: 'http://' + config.host + ':8002/v1/rest-apis/' + name + '?include=content&include=modules',
    json: true,
    headers: {
      'Content-Type': 'application/json'
    },
    auth: config.auth
  };
  try {
    const response = await rp(options);
    console.log('REST instance deleted: '.green + name);
  } catch (error) {
    handleError(error);
  }
}

const deleteXDBC = async (name) => {
  const options = {
    method: 'DELETE',
    uri: 'http://' + config.host + ':8002/manage/v2/servers/' + name + '?group-id=Default&format=json',
    headers: {
      'Content-Type': 'application/json'
    },
    auth: config.auth
  };
  try {
    const response = await rp(options);
    console.log('XDBC server deleted: '.green + name);
  } catch (error) {
    handleError(error);
  }
}

const deleteUser = async (name) => {
  const options = {
    method: 'DELETE',
    uri: 'http://' + config.host + ':8002/manage/v2/users/' + name,
    headers: {
      'Content-Type': 'application/json'
    },
    auth: config.auth
  };
  try {
    const response = await rp(options);
    console.log('User deleted: '.green + name);
  } catch (err) {
    if (err.statusCode === 404) {
      console.error("User does not exist: ".red + name)
    } else {
      console.error(err);
    }
  }
}

const deleteRole = async (name) => {
  const options = {
    method: 'DELETE',
    uri: 'http://' + config.host + ':8002/manage/v2/roles/' + name,
    headers: {
      'Content-Type': 'application/json'
    },
    auth: config.auth
  };
  try {
    const response = await rp(options);
    console.log('Role deleted: '.green + name);
  } catch (error) {
    handleError(error);
  }
}

 const start = async () => {
  console.log(
    '                           TEARDOWN STARTED                           '.gray.bold.inverse
  );
  await deleteXDBC(config.xdbc["server-name"]);
  pressAnyKey("Restart MarkLogic Server, then press any key to continue.".red)
  .then(async () => {
    await deleteREST(config.rest["rest-api"].name);
    pressAnyKey("Restart MarkLogic Server, then press any key to continue.".red)
    .then(async () => {
      await deleteDatabase(config.databases.content.name);
      await deleteDatabase(config.databases.modules.name);
      await deleteUser(config.user["user-name"]);
      await deleteRole(config.role["role-name"]);
      console.log(
        '                           TEARDOWN FINISHED                          '.gray.bold.inverse
      );
    })
  })
  
}

start();
