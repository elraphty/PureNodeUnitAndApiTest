/**
 * Request Handling File 
 */

const _data = require('./data');
const _helpers = require('./helpers');
const libItems = require('./items');

const handlers = {};

handlers.notfound = (data, callback) => {
  callback(404, {error:  'Page Not Found'});
};

handlers.ping = (data, callback) => {
  callback(200, {success:  'Ping Hello!'});
};

// receieve request on users route here and pass to _users 
handlers.users = (data, callback) => {
  let acceptedMethods = ['put', 'post', 'get', 'delete'];
  if(acceptedMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(404);
  }
};

// Users 
handlers._users = {};

handlers._users.post = (data, callback) => {
  
  let userEmail = typeof(data.payload.email) === 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  let userName = typeof(data.payload.name) === 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  let userAddress = typeof(data.payload.address) === 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  let userPass = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Create User 
  if(userName && userEmail && userAddress && userPass) {
    _data.read('users', userEmail, (err) => {
      if(err) {
        let hashedPassword = _helpers.hashPassword(userPass);
        if(hashedPassword) {

          let userObject = {
            userName,
            userEmail,
            userAddress,
            userPass: hashedPassword
          };

          _data.create('users', userEmail, userObject, (err) => {
            if(err) {
              console.log('Error', err);
              callback(403, {'Error': 'Could not create user'})
            } else {
              callback(200);
            }
          });
        } else {
          callback(405, {'Error': 'Password could not be hashed'});
        }
      } else {
        callback(405, {'Error': 'User already exists'});
      }
    });
  } else {
    callback(405, {'Error': 'Please supply a valid data'});
  }
}

handlers._users.get = (data, callback) => {
  let userEmail = typeof(data.queryStringObject.email) === 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;

  if(userEmail) {
    let token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    handlers._tokens.verifyToken(token, userEmail, (tokenValid) => {
      if(tokenValid) {
        _data.read('users', userEmail, (err, data) => {
          if(!err && data) {
            // Delete user password before sending
            delete data.userPass;
            callback(200, data);
          } else {
            callback(405, {'Error': 'Could not read user'})
          }
        });
      } else {
        callback(405, {'Error': 'Token could not be verified it must have expired'})
      }
    });
  }
}

handlers._users.put = (data, callback) => {
  let userEmail = typeof(data.payload.email) === 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;

  let userName = typeof(data.payload.name) === 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  let userAddress = typeof(data.payload.address) === 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  let userPass = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if(userEmail) {
    let token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    //verify that the given token is valid for the email
    handlers._tokens.verifyToken(token, userEmail, (tokenIsValid) => {
      if(tokenIsValid) {
          // lookup the user
          _data.read('users', userEmail, (err, userData) => {
            if(!err && userData) {
              // update the fields necessary
              if(userName) {
                userData.userName = userName;
              }
              if(userAddress) {
                userData.userAddress = userAddress;
              }
              if(userPass) {
                userData.userPass = _helpers.hashPassword(userPass);
              }

              // Store the new updates
              _data.update('users', userEmail, userData, (err) => {
                if(!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback({'Error' : 'Could not update the user'})
                }
              });
            }
          });
      } else {
        callback(405, {'Error': 'Token is not valid'});
      }
    });
  } else {
    callback(404, {'Error': 'Missing required field'});
  }
}

handlers._users.delete = (data, callback) => {
  let userEmail = typeof(data.queryStringObject.email) === 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;

  if(userEmail) {
    let token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    handlers._tokens.verifyToken(token, userEmail, (isTokenValid) => {
      if(isTokenValid) {
        _data.read('users', userEmail, (err, data) => {
          if(!err && data) {
            _data.delete('users', userEmail, (err) => {
              if(!err){
                callback(200);
              } else {
                callback(403, {'Error': 'Could not delete user'})
              }
            });
          } else {
            callback(403, {'Error': 'Could not look up user'});
          }
        });
      } else {
        callback(403, {'Error': 'Token is not valid'})
      }
    });
  } else {
    callback(404, {'Error': 'Missing required fields'})
  }
}

// Tokens Handler
handlers.tokens = (data, callback) => {
  let acceptedMethods = ['post', 'get', 'put', 'delete'];
  if(acceptedMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(404);
  }
}

handlers._tokens = {};

handlers._tokens.post = (data, callback) => {
  let userEmail = typeof(data.payload.email) === 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  let userPass = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  
  if(userEmail && userPass) {
    _data.read('users', userEmail, (err, data) => {
      if(!err && data) {
        // Confirm if is the exact user by comparing password and email
        if(data.userEmail === userEmail && data.userPass === _helpers.hashPassword(userPass)) {
          // if valid, create a new token with a random name, set expiration data One Day in the future
          tokenId = _helpers.generateToken(30);
          const expires = Date.now() + 1000 * 60 * 60 * 24,
            
          tokenObject = {
            email: userEmail,
            id : tokenId,
            expires
          }

          _data.create('tokens', tokenId, tokenObject, (err) => {
            if(!err) {
              callback(false)
            } else {
              callback('Error Creating Token');
            }
          });
        } else {
          callback(404, {'Error': 'Not a valid user'});
        }
      } else {
        console.log(err);
      }
    });
  }
}

handlers._tokens.get = (data, callback) => {
  
}

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = (data, callback) => {
  // check the id is valid
  const id = typeof(data.queryStringObject.token) === 'string' && data.queryStringObject.token.trim().length === 30 ? data.queryStringObject.token.trim() : false;

  if(id) {
    // look up the user
    _data.read('tokens', id, (err,data) => {
      if(!err && data) {
        _data.delete('tokens', id, (err) => {
          if(!err) {
            callback(200);
          } else {
            callback(500, {'Error' : 'Could not delete the specified token'});
          }
        });
      }
      else {
        callback(404, {'Error' : 'Could not find the specified token'});
      }
    });

  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
}

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, email, callback) => {
  _data.read('tokens', id, function(err, tokenData) {
    if(!err && tokenData) {
      // check that the token is for the given user and has not expired
      if(tokenData.email === email && tokenData.expires > Date.now()) {
        console.log('Email Matched time ok');
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
}

// Items handler to view all items
handlers.items = (data, callback) => {
  // Return the items object in item.js
  const items = libItems;

  callback(200, {items});
};

// Conttoller handler for cart
handlers.carts = (data, callback) => {
  let acceptedMethods = ['post', 'get', 'put', 'delete'];
  if(acceptedMethods.indexOf(data.method) > -1) {
    handlers._carts[data.method](data, callback);
  } else {
    callback(404);
  }

};

// Carts method container 
handlers._carts = {};

// Carts - post
// required fields items.name, items.quantity, items.price
handlers._carts.post = (data, callback) => {
  const items = typeof(data.payload.items) === 'object' && data.payload.items instanceof Array && data.payload.items.length > 0 ? data.payload.items : false;
  if(items) {
    // Get the token from the header
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    //verify that the given token is valid
    _data.read('tokens', token, (err, tokenData) => {
      if(!err && data) {
        const userEmail = tokenData.email,
        cartId = Date.now();
        cartObject = {
          items,
          'status' : 'active',
          userEmail
        };
      
        // lookup the userdata
        _data.read('users', userEmail, (err, userData) => {
          if(!err && userData) {
            const userCarts = typeof(userData.carts) === 'object' && userData.carts instanceof Array ? userData.carts : [];
            if(userCarts.length > 0) {
              // retrieve the last cart id
              lastCart = userCarts[userCarts.length -1];
              _data.read('carts', lastCart, (err, cartData) => {

                // retrieve the last cart details
                if(!err && cartData) {
                  if (cartData.status == 'active') {
                    callback(403, {'Error' : 'You have an active cart kindly use it to place your order or destroy it before creating another'});
                  } else {
                    // save the object
                    _data.create('carts', cartId, cartObject, (err) => {
                      if(!err) {
                        // Add the cart to the userobject
                        userData.carts = userCarts;
                        userData.carts.push(cartId);

                        // save the new user data
                        _data.update('users', userEmail, userData, (err) => {
                          if(!err) {
                            // Return the data about the new cart
                            callback(200, cartObject.items);
                          } else {
                            callback(500, {'Error' : 'Could not update the user with the new cart'});
                          }
                          
                        });
                      } else {
                        callback(500, {'Error' : 'Could not create the new cart'});
                        
                      }
                    });
                  }
                } else {
                  callback(500, {'Error' : 'Could not create the new cart'});
                }
              });
            } else {
              // save the object the user have never created a cart
              _data.create('carts', cartId, cartObject, (err) => {
                if(!err) {
                  // Add the cart to the userobject
                  userData.carts = userCarts;
                  userData.carts.push(cartId);

                  // save the new user data
                  _data.update('users', userEmail, userData, (err) => {
                    if(!err) {
                      // Return the data about the new cart
                      callback(200, cartObject.items);
                    } else {
                      callback(500, {'Error' : 'Could not update the user with the new cart'});
                    }
                  })
                } else {
                  callback(500, {'Error' : 'Could not create the new cart'});
                  
                }
                
              });
              
            }
          } else {
            callback({'Error' : 'Invalid token provided'});
          }
        });
      } else {
        callback(403, {'Error' : 'Token not present on header or invalid token suplied'});
      }
    })
    
  } else {
    callback(400, {'Error' : 'Missing required inputs or inputs are invalid'});
    
  }
}

// Carts - get
handlers._carts.get = function(data, callback) {
  // get the token from header object
  const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
  if(token) {
    //verify that the given token is valid
    _data.read('tokens', token, (err, tokenData) => {
      if(!err && data) {
        const userEmail = tokenData.email;
        // lookup the userdata
        _data.read('users', userEmail, (err, userData) => {
          if(!err && userData) {
            const userCarts = typeof(userData.carts) === 'object' && userData.carts instanceof Array ? userData.carts : [];
            if(userCarts.length > 0) {
              // retrieve the last cart id
              lastCart = userCarts[userCarts.length -1];
              _data.read('carts', lastCart, (err, cartData) => {

                // retrieve the last cart details
                if(!err && cartData) {
                  if (cartData.status === 'active') {
                    callback(200, cartData.items);
                  } else {
                    callback(403, {'Error' : 'You don\'t have an active cart kindly create a new one'});
                  }
                } else {
                  callback(500, {'Error' : 'Could not create the new cart'});
                }
                
              });
              
            } else {
              callback(403, {'Error' : 'You haven\'t created a cart at all kindly create a new one'})
            }
          } else {
            callback({'Error' : 'Invalid token provided'});
          }
        });
      } else {
        callback(500, {'Error' : 'An error occured while creating your car'});
        
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
};

// Cart - put
// Required data: token items
handlers._carts.put = function(data, callback) {
  // get the token from header object
  const token = typeof(data.headers.token) === 'string' ? data.headers.token : false,
  items = typeof(data.payload.items) === 'object' && data.payload.items instanceof Array && data.payload.items.length > 0 ? data.payload.items : false;
  
  if(token && items) {
    //verify that the given token is valid
    _data.read('tokens', token, (err, tokenData) => {
      if(!err && data) {
        const userEmail = tokenData.email;
        // lookup the userdata
        _data.read('users', userEmail, (err, userData) => {
          if(!err && userData) {
            const userCarts = typeof(userData.carts) === 'object' && userData.carts instanceof Array ? userData.carts : [];
            if(userCarts.length > 0) {
              // retrieve the last cart id
              lastCart = userCarts[userCarts.length -1]; 
              _data.read('carts', lastCart, (err, cartData) => {

                // retrieve the last cart details
                if(!err && cartData) {
                  if(cartData.status == 'active') {
                    cartData.items = items;

                    // Store the new updates
                    _data.update('carts', lastCart, cartData, (err) => {
                      if(!err) {
                        callback(200);
                      } else {
                        callback(500,{'Error' : 'Could not update cart'});
                      }
                    });
                  } else {
                    callback(403, {'Error' : 'You don\'t have an active cart kindly create a new one'});
                  }
                } else {
                  callback(500, {'Error' : 'Could not create the new cart'});
              
                }
              });
            } else {
              callback(403, {'Error' : 'You haven\'t created a cart at all kindly create a new one'})
            }
        
          } else {
            callback({'Error' : 'Invalid token provided'});
          }
        });
      } else {
        callback(500, {'Error' : 'An error occured while creating your car'});
      }
      
    });
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
};


// Cart - delete
// Required data: token
// optional data: none
handlers._carts.delete = function(data, callback) {
  // get the token from header object
  const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
  if(token) {
    //verify that the given token is valid
    _data.read('tokens', token, (err, tokenData) => {
      if(!err && data) {
        const userEmail = tokenData.email;
        // lookup the userdata
         _data.read('users', userEmail, (err, userData) => {
          if(!err && userData) {
            const userCarts = typeof(userData.carts) === 'object' && userData.carts instanceof Array ? userData.carts : [];
            if(userCarts.length > 0) {
              // retrieve the last cart id
              lastCart = userCarts[userCarts.length -1];
              _data.read('carts', lastCart, (err, cartData) => {

                // retrieve the last cart details
                if(!err && cartData) {
                  if (cartData.status === 'active') {

                    // Delete the cartData
                    _data.delete('carts', lastCart, (err) => {
                      if(!err) {
                        const userCarts = typeof(userData.carts) === 'object' && userData.carts instanceof Array ? userData.carts : [];
                        console.log(userData, lastCart, userCarts.indexOf(parseInt(lastCart)));
                          
                        // Remove the user cart from the list of carts
                        const cartPosition = userCarts.indexOf(parseInt(lastCart));
                        if(cartPosition > -1) {
                          userCarts.splice(cartPosition, 1);
                          userData.carts = userCarts;
                            
                          // save the user data
                          _data.update('users', userEmail, userData, (err) => {
                            if(!err) {
                              callback(200);
                            } else {
                              callback(500, {'Error' : 'Could not update the specified user'});
                            }
                          });
                        } else {
                          callback(500, {'Error' : 'Could not find the cart object on the user object so cannot remove it'})
                        }
                      } else {
                        callback(500, {'Error' : 'Could not delete the cart data'})
                      }
                    });
                  } else {
                    callback(403, {'Error' : 'You don\'t have an active cart kindly create a new one'});
                  }
                } else {
                  callback(500, {'Error' : 'You do not have an active cart'});
                }
              });
            } else {
              callback(403, {'Error' : 'You haven\'t created a cart at all kindly create a new one'})
            }
          } else {
            callback({'Error' : 'Invalid token provided'});
          }
        });
      } else {
      callback(500, {'Error' : 'An error occured while creating your car'});
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
};

// Order handler
handlers.order = (data, callback) => {
  // get the token from header object
  const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
  if(token) {
  //verify that the given token is valid
  _data.read('tokens', token, (err, tokenData) => {
    if(!err && data) {
      const userEmail = tokenData.email;
      // lookup the userdata
      _data.read('users', userEmail, (err, userData) => {
        if(!err && userData) {
          const userCarts = typeof(userData.carts) === 'object' && userData.carts instanceof Array ? userData.carts : [];
          if(userCarts.length > 0) {
            // retrieve the last cart id
            lastCart = userCarts[userCarts.length -1];
            _data.read('carts', lastCart, (err, cartData) => {

              // retrieve the last cart details
              if(!err && cartData) {

                // if the cart is active proceed to order
                if (cartData.status === 'active') {
                  const items = libItems,
                  itemObj = {};
                  let totalAmount = 0,
                    totalQuantity = 0,
                    emailMsg = `Dear ${userData.customerName},\nHere is your receipt for the pizza you ordered on our site\n`;
                  items.forEach((item) => {
                    itemObj[`${item.id}`] = item;
                  });
                  cartData.items.forEach((itm) => {
                    const currentItem = itemObj[itm.id];
                    totalAmount += currentItem.price * itm.quantity;
                    totalQuantity += itm.quantity;
                    emailMsg += `${itm.quantity} quantities of ${currentItem.name} at ${currentItem.price} USD each\n`;
                  });
                  emailMsg += `Total Quantity of ordered pizza is: ${totalQuantity} at a total price of ${totalAmount} USD`;

                  // initiate payment
                  helpers.payViaStripe(totalAmount, (err) => {
                    if(!err) {
                      // change cart status to closed
                      cartData.status = 'closed';

                  // Store the new updates
                  _data.update('carts', lastCart, cartData, (err) => {
                    if(!err) {
                      callback(200);

                      // send order details to user
                      helpers.sendMail(userEmail, emailMsg, (err) => {
                        if(!err) {
                          console.log('\x1b[32m%s\x1b[0m', 'email sent successfully');
                        } else {
                          console.log('\x1b[31m%s\x1b[0m', 'email not sent successfully');
                        }
                      });
                    } else {
                      callback(500,{'Error' : 'Could not update cart'});
                    }
                  });
                    } else {
                      callback(500, {'Error' :  'unable to make order payment'});
                    }
                  })
                } else {
                  callback(403, {'Error' : 'Your cart is empty, please create a new cart'});
                }
              } else {
                callback(500, {'Error' : 'Could not retrieve your order details'});
              }
            });
          } else {
            callback(403, {'Error' : 'You haven\'t created a cart at all kindly create a new one'})
          }
        } else {
          callback({'Error' : 'Invalid token provided'});
        }
      })
    } else {
          callback(500, {'Error' : 'An error occured while creating your car'});
        }
    });
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
};

module.exports = handlers;
