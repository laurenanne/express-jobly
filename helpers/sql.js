const { BadRequestError } = require("../expressError");

// Data to update can include: { firstName, lastName, password, email }. This function takes the data
// and alters the javascript to the SQl format needed for the query.
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  console.log(keys);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  console.log(cols);
  // returns an object with the columns being updated set equal to $1, $2 etc and an array of new values of the columns.
  // {setCols: "first_name"=$1, "last_name"=$2, values: [ 'newFirstName', 'newLastName' ]}

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

function sqlForFilter(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  const values = Object.values(dataToUpdate);

  for (let value in values) {
    if (isNaN(value)) {
      value.toLowerCase();
    }
  }
  const vals = values.map(function (value) {
    if (isNaN(value)) {
      value.toLowerCase();
      return `%${value}%`;
    } else {
      return value;
    }
  });

  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['first_name=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `${jsToSql[colName] || colName} $${idx + 1}`
  );

  // returns an object with the columns being updated set equal to $1, $2 etc and an array of new values of the columns.
  // {setCols: "first_name"=$1, "last_name"=$2, values: [ 'newFirstName', 'newLastName' ]}

  return {
    setCols: cols.join(" AND "),
    values: vals,
  };
}

module.exports = { sqlForPartialUpdate, sqlForFilter };
