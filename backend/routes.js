const pool = require('./db')
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const checkAuth = require('./middleware/check-auth');

module.exports = function routes(app, logger) {
  // GET /
  app.get('/', (req, res) => {
    res.status(200).send('Go to 0.0.0.0:3001.');
  });

  //get all the players from a team
  app.get('/team/allplayers', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var TeamID = req.param('TeamID');
        connection.query("select * from Players join Teams T on T.TeamID = Players.TeamID where T.TeamID = ? order by FirstName", TeamID, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });
  });


  //register user
  app.post('/users/register', async (req, res) => {
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var username = req.body.username;
    var passwd = await bcrypt.hash(req.body.passwd, 10);
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        return logger.error('Problem obtaining MySQL connection', err)
      }
      connection.query('select * from Users where username = ?', username, function (err, result, fields) {
        if (err) {
          // if there is an error with the query, release the connection instance and log the error
          connection.release()
          return logger.error("Problem checking if username exists ", err);
        } else {
          // if there is no error with the query, release the connection instance
          res.send(result);
          if (result.length > 0) {
            connection.release()
            return logger.error("Username already exists ", err);
          }
          else {
            connection.query('insert into Users (firstName, lastName, username, password) values (?,?,?,?)', [firstName, lastName, username, passwd], function (err, result, fields) { });
          }
          connection.release()

        }
      });


    })
  });

  app.post('/users/login', async (req, res) => {
    var username = req.body.username;
    var passwd = req.body.passwd;
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        connection.release();
        return logger.error('Problem obtaining MySQL connection', err)
      }

      connection.query('select * from Users where username = ?', username, function (err, result, fields) {
        if (err) {
          // if there is an error with the query, release the connection instance and log the error
          connection.release()
          return logger.error("Problem checking if username exists ", err);
        }
        if (result.length === 0) {
          connection.release()
          return res.status(401).json({
            message: 'Authentication Failed'
          });
        }
        else {
          connection.query('select password from Users where username = ?', username, function (err, result, fields) {
            if (err) {
              // if there is an error with the query, release the connection instance and log the error
              connection.release()
              return logger.error("Problem getting password ", err);
            }
            else {
              var hash = result[0].password;
              bcrypt.compare(passwd, hash, (err, result2) => {
                if (err) {
                  connection.release();
                  return res.status(401).json({
                    message: 'Authentication Failed'
                  });
                }
                if (result2) {
                  const token = jwt.sign({ username: req.body.username }, 'secret', {
                    expiresIn: "1h"
                  });

                  connection.release();
                  return res.status(200).json({
                    message: 'Authentication Successful',
                    token: token
                  });
                }
                if (!result2) {
                  connection.release();
                  return res.status(401).json({
                    message: 'Authentication Failed'
                  });
                }

              });
            }
          })
        }
      });

    })
  })

  // edit a player's picture
  // /player/picture
  // example body: {"playerID":"2", "playerPicture":"https://phantom-marca.unidadeditorial.es/4089255addf9328ce86c33c9213519ab/resize/1320/f/jpg/assets/multimedia/imagenes/2021/11/09/16364610626277.jpg"}
  app.put('/player/picture', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        // does NOT take in playerID
        var playerID = req.body.playerID;
        var playerPicture = req.body.playerPicture;
        connection.query("UPDATE Players SET Picture = ? WHERE PlayerID = ?", [playerPicture, playerID], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem changing a player picture: ", err);
            res.status(400).send('Problem changing a player picture');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });

  // add a new player to a team's roster
  // /player
  // example body: {"playerLastName":"Astley","playerFirstName":"Rick","playerNumber":"123","teamID":"1","playerPPG":"2","playerPos":"X","playerTimePlayed":"30","coachID":"1","playerPicture":"https://variety.com/wp-content/uploads/2021/07/Rick-Astley-Never-Gonna-Give-You-Up.png?w=1024"}
  app.post('/player', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        // does NOT take in playerID
        var playerLastName = req.body.playerLastName;
        var playerFirstName = req.body.playerFirstName;
        var playerNumber = req.body.playerNumber;
        var teamID = req.body.teamID;
        var playerPPG = req.body.playerPPG;
        var playerPos = req.body.playerPos;
        var playerTimePlayed = req.body.playerTimePlayed;
        var coachID = req.body.coachID;
        var playerPicture = req.body.playerPicture;
        connection.query("INSERT INTO Players (LastName, FirstName, PlayerNumber, TeamID, PPG, Position, TimePlayed, CoachID, Picture) VALUES (?,?,?,?,?,?,?,?,?)", [playerLastName, playerFirstName, playerNumber, teamID, playerPPG, playerPos, playerTimePlayed, coachID, playerPicture], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem adding a player: ", err);
            res.status(400).send('Problem adding a player');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });


  // update a specific player's position
  // /player/position?playerID=123&playerPos=Quarterback
  app.put('/player/position', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var playerID = req.body.playerID;
        var playerPos = req.body.playerPos;
        connection.query("UPDATE Players SET Position = ? WHERE PlayerID = ?", [playerPos, playerID], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem updating player position: ", err);
            res.status(400).send('Problem updating player position');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });
  // get players ppg, just specify player first and last name using body
  app.get('/player/ppg', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        connection.query("select PPG from Players where FirstName = ? and LastName = ?", [firstName, lastName], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting ppg: ", err);
            res.status(400).send('Problem getting ppg');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });


  // get list of players so that you can vote for mvp (assume it should be filtered by the league but they did not say that)
  app.get('/players', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var league = req.body.league;
        connection.query("select FirstName,LastName,TeamName from Players join Teams T on T.TeamID = Players.TeamID where League = ?", [league], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting ppg: ", err);
            res.status(400).send('Problem getting ppg');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });


  //gets list of games a player has played in, just specify first and last name, returns the players name, and the game ids
  app.get('/player/games', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var firstName = req.param('firstName');
        var lastName = req.param('lastName');
        connection.query("select FirstName,LastName,GameID from Players P join Teams T on P.TeamID = T.TeamID join Games G on T.TeamID = G.Team1ID or T.TeamID=G.Team2ID where P.FirstName=? and P.LastName=?", [firstName, lastName], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting ppg: ", err);
            res.status(400).send('Problem getting ppg');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });

  //update a games score, must specify which team, which game and the score you want to update
  app.put('/games/score', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var GameID = req.body.GameID;
        var score = req.body.score;
        var teamNum = req.body.teamNum;
        if (teamNum = 1) {
          connection.query("update Games set Team1Score = ? where GameID = ?;", [score, GameID], function (err, result, fields) {
            if (err) {
              // if there is an error with the query, release the connection instance and log the error
              connection.release()
              logger.error("Problem getting ppg: ", err);
              res.status(400).send('Problem getting ppg');
            }
            else {
              // if there is no error with the query, release the connection instance
              res.send(result);
              connection.release()
            }
          });
        }
        else {
          connection.query("update Games set Team2Score = ? where GameID = ?;", [score, GameID], function (err, result, fields) {
            if (err) {
              // if there is an error with the query, release the connection instance and log the error
              connection.release()
              logger.error("Problem getting ppg: ", err);
              res.status(400).send('Problem getting ppg');
            }
            else {
              // if there is no error with the query, release the connection instance
              res.send(result);
              connection.release()
            }
          });
        }
      }
    });
  });



  // POST /multplynumber
  app.post('/multplynumber', (req, res) => {
    console.log(req.body.product);
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        // if there is no issue obtaining a connection, execute query and release connection
        connection.query('INSERT INTO `db`.`test_table` (`value`) VALUES(\'' + req.body.product + '\')', function (err, rows, fields) {
          connection.release();
          if (err) {
            // if there is an error with the query, log the error
            logger.error("Problem inserting into test table: \n", err);
            res.status(400).send('Problem inserting into table');
          } else {
            res.status(200).send(`added ${req.body.product} to the table!`);
          }
        });
      }
    });
  });

  // GET /checkdb
  app.get('/values', (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        // if there is no issue obtaining a connection, execute query and release connection
        connection.query('SELECT value FROM `db`.`test_table`', function (err, rows, fields) {
          connection.release();
          if (err) {
            logger.error("Error while fetching values: \n", err);
            res.status(400).json({
              "data": [],
              "error": "Error obtaining values"
            })
          } else {
            res.status(200).json({
              "data": rows
            });
          }
        });
      }
    });
  });

  app.get('/games/leagueASC', (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var league = req.param('league');
        connection.query("select * from Games join Teams T on Games.WinnerID = T.TeamID where League = ? order by Date", league, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }  
        });
      }
    });
  });

  //get name of first team from specific game
  app.get('/games/team1', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var GameID = req.param("GameID");
        connection.query("select * from Teams join Games G on Teams.TeamID = G.Team1ID where GameID=?", GameID, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });
  });

  //get name of second team from specified game
  app.get('/games/team2', (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var GameID = req.param("GameID");
        connection.query("select * from Teams join Games G on Teams.TeamID = G.Team2ID where GameID=?", GameID, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting TeamName from Teams: ", err);
            res.status(400).send('Problem getting TeamName from Teams');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });
  });

  //get name of second team from specified game
  app.get('/team/playersByPosition', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var teamID = req.param('teamID');
        connection.query("select FirstName,LastName,Position from Players join Teams T on T.TeamID = Players.TeamID where T.TeamID = ? order by Position", teamID, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });
  });

    //get name of players from team by name
    app.get('/team/playersByName', async (req, res) => {
      // obtain a connection from our pool of connections
      pool.getConnection(function (err, connection) {
        if (err) {
          console.log(connection);
          // if there is an issue obtaining a connection, release the connection instance and log the error
          logger.error('Problem obtaining MySQL connection', err)
          res.status(400).send('Problem obtaining MySQL connection');
        } else {
          var teamID = req.param('teamID');
          connection.query("select FirstName,LastName,Position from Players join Teams T on T.TeamID = Players.TeamID where T.TeamID = ? order by LastName", teamID, function (err, result, fields) {
            if (err) {
              // if there is an error with the query, release the connection instance and log the error
              connection.release()
              logger.error("Problem getting games from league: ", err);
              res.status(400).send('Problem getting games from league');
            } else {
              // if there is no error with the query, release the connection instance
              res.send(result);
              connection.release()
  
            }
          });
  
        }
      });
    });
  

  //get players peformance from specific game
  app.get('/player/stats', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var firstName = req.param('firstName');
        var lastName = req.param('lastName');
        connection.query("select PPG,TimePlayed from Players where FirstName=? and LastName=?", [firstName, lastName], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });


  });


  //specified leagues standings
  app.get('/league/rankings', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var league = req.param('league');

        connection.query("select * from Teams where League=? order by (Wins) desc,(Wins/Losses) desc", league, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });


  });


  //get wins, losses for a specific team
  app.get('/team/record', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var teamName = req.param('teamName');

        connection.query("select TeamName,Wins,Losses from Teams where TeamName=?", teamName, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });


  });




  //check if game is the most recent game played
  app.get('/game/mostRecent', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var league = req.param('league');
        var gameID = req.param('gameID');
        connection.query("with cte1 as(select * from Games join Teams T on Games.WinnerID = T.TeamID where GameID=? and League=? limit 1),cte2 as(select * from Games join Teams T2 on Games.WinnerID = T2.TeamID where T2.League=? order by Date limit 1) select count(Date) as count from( select date from cte2 a union select Date from cte1 b) x;", [gameID, league, league], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result[0].count === 1);
            connection.release()

          }
        });

      }
    });


  });

  //post a vote for a player for a specified game
  app.post('/game/mvp', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var gameID = req.body.gameID;
        var playerID = req.body.playerID;
        connection.query("insert into votes(gameID, playerID) values (?,?)", [gameID, playerID], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });


  });

  //Get mvp for a specified game
  app.get('/game/mvp', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var gameID = req.param('gameID');

        connection.query("select P.PlayerID, P.FirstName, P.LastName from votes join Games G on G.GameID = votes.gameID join Players P on P.PlayerID = votes.playerID where G.GameID=? group by playerID order by count(*) desc limit 1", gameID, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });


  });
  //get winner of a game
  app.get('/game/winner', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var gameID = req.param('gameID');


        connection.query("select WinnerID from Games where GameID=?", gameID, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });


  });

  //choose if game is hidden or not
  app.put('/game/hide', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var gameID = req.body.gameID;
        var isHidden = req.body.isHidden;

        connection.query("update Games set Games.hidden=? where GameID=?", [isHidden, gameID], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });


  });


  app.get('/game/hide', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var gameID = req.param('gameID');


        connection.query("select hidden from Games where GameID=?", gameID, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });


  });


  app.get('/player/number', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var playerID = req.param('playerID');


        connection.query("select PlayerNumber from Players where PlayerID=?", playerID, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });


  });

  app.get('/player/position', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var playerID = req.param('playerID');


        connection.query("select Position from Players where PlayerID=?", playerID, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });


  });

  app.get('/player/picture', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var playerID = req.param('playerID');


        connection.query("select Picture from Players where PlayerID=?", playerID, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });

      }
    });


  });


  app.get('/games/leagueDESC', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var league = req.param('league');
        connection.query("select * from Games join Teams T on Games.WinnerID = T.TeamID where League = ? order by Date desc", league, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });

  app.post('/game', async (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        // does NOT take in playerID
        var team1ID = req.body.team1ID;
        var team2ID = req.body.team2ID;
        var team1Score = req.body.team1Score;
        var team2Score = req.body.team2Score;
        var winnerID = req.body.winnerID;

        var date = req.body.date;
        connection.query("insert into Games ( Team1ID,Team2ID, Team1Score, Team2Score, WinnerID, Date) values (?,?,?,?,?,?)", [team1ID, team2ID, team1Score, team2Score, winnerID, date], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem adding a player: ", err);
            res.status(400).send('Problem adding a player');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });


  //The following puts are all for updating the games table

  //update team 1 id
  app.put('/games/team1ID', (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var team1ID = req.body.team1ID;
        var gameID = req.body.gameID
        connection.query("update Games set Team1ID=? where GameID=?", [team1ID, gameID], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });


  //update team 2 id
  app.put('/games/team2ID', (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var team2ID = req.body.team2ID;
        var gameID = req.body.gameID
        connection.query("update Games set Team2ID=? where GameID=?", [team2ID, gameID], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });


  //update team 1 score
  app.put('/games/team1score', (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var team1Score = req.body.team1Score;
        var gameID = req.body.gameID
        connection.query("update Games set Team1Score=? where GameID=?", [team1Score, gameID], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });

  //update team 2 score
  app.put('/games/team2score', (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var team2Score = req.body.team2Score;
        var gameID = req.body.gameID
        connection.query("update Games set Team2Score=? where GameID=?", [team2Score, gameID], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });

  //update winner
  app.put('/games/winnerID', (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var winnerID = req.body.winnerID;
        var gameID = req.body.gameID
        connection.query("update Games set WinnerID=? where GameID=?", [winnerID, gameID], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });


  //update date
  app.put('/games/date', (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var date = req.body.date;
        var gameID = req.body.gameID
        connection.query("update Games set Date=? where GameID=?", [date, gameID], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });


  //get teamID given team name
  app.get('/teams/teamID', (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var teamName = req.param('teamName');
        connection.query("select TeamID from Teams where TeamName=?", teamName, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });

  //get teamName given team id
  app.get('/teams/teamName', (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var teamID = req.param('teamID');
        connection.query("select TeamName from Teams where TeamID=?", teamID, function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });


  //get score of specific team from specific game 
  app.get('/game/teamScore', (req, res) => {
    // obtain a connection from our pool of connections
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(connection);
        // if there is an issue obtaining a connection, release the connection instance and log the error
        logger.error('Problem obtaining MySQL connection', err)
        res.status(400).send('Problem obtaining MySQL connection');
      } else {
        var gameID = req.param('gameID');
        var teamID = req.param('teamID');
        connection.query("select if(Games.Team1ID=?,Games.Team1Score,Games.Team2Score) as score from Games where GameID=?", [teamID,gameID], function (err, result, fields) {
          if (err) {
            // if there is an error with the query, release the connection instance and log the error
            connection.release()
            logger.error("Problem getting games from league: ", err);
            res.status(400).send('Problem getting games from league');
          } else {
            // if there is no error with the query, release the connection instance
            res.send(result);
            connection.release()

          }
        });
      }
    });
  });

//get teamName given team id
app.get('/team/league', (req, res) => {
  // obtain a connection from our pool of connections
  pool.getConnection(function (err, connection) {
    if (err) {
      console.log(connection);
      // if there is an issue obtaining a connection, release the connection instance and log the error
      logger.error('Problem obtaining MySQL connection', err)
      res.status(400).send('Problem obtaining MySQL connection');
    } else {
      var teamID = req.param('teamID');
      connection.query("select League from Teams where TeamID=?", teamID, function (err, result, fields) {
        if (err) {
          // if there is an error with the query, release the connection instance and log the error
          connection.release()
          logger.error("Problem getting games from league: ", err);
          res.status(400).send('Problem getting games from league');
        } else {
          // if there is no error with the query, release the connection instance
          res.send(result);
          connection.release()

        }
      });
    }
  });
});

//get the league a team is in
app.get('/team/league', (req, res) => {
  // obtain a connection from our pool of connections
  pool.getConnection(function (err, connection) {
    if (err) {
      console.log(connection);
      // if there is an issue obtaining a connection, release the connection instance and log the error
      logger.error('Problem obtaining MySQL connection', err)
      res.status(400).send('Problem obtaining MySQL connection');
    } else {
      var teamID = req.param('teamID');
      connection.query("select League from Teams where TeamID=?", teamID, function (err, result, fields) {
        if (err) {
          // if there is an error with the query, release the connection instance and log the error
          connection.release()
          logger.error("Problem getting games from league: ", err);
          res.status(400).send('Problem getting games from league');
        } else {
          // if there is no error with the query, release the connection instance
          res.send(result);
          connection.release()

        }
      });
    }
  });
});


//search for a player by name
app.get('/player', (req, res) => {
  // obtain a connection from our pool of connections
  pool.getConnection(function (err, connection) {
    if (err) {
      console.log(connection);
      // if there is an issue obtaining a connection, release the connection instance and log the error
      logger.error('Problem obtaining MySQL connection', err)
      res.status(400).send('Problem obtaining MySQL connection');
    } else {
      var firstName = req.param('firstName');
      var lastName = req.param('lastName');
      connection.query("select * from Players where FirstName=? and LastName=?", [firstName,lastName], function (err, result, fields) {
        if (err) {
          // if there is an error with the query, release the connection instance and log the error
          connection.release()
          logger.error("Problem getting games from league: ", err);
          res.status(400).send('Problem getting games from league');
        } else {
          // if there is no error with the query, release the connection instance
          res.send(result);
          connection.release()

        }
      });
    }
  });
});

//search for a player by name
app.get('/playerByID', (req, res) => {
  // obtain a connection from our pool of connections
  pool.getConnection(function (err, connection) {
    if (err) {
      console.log(connection);
      // if there is an issue obtaining a connection, release the connection instance and log the error
      logger.error('Problem obtaining MySQL connection', err)
      res.status(400).send('Problem obtaining MySQL connection');
    } else {
      var PlayerID = req.param('PlayerID');
      connection.query("select * from Players where PlayerID = ?", PlayerID, function (err, result, fields) {
        if (err) {
          // if there is an error with the query, release the connection instance and log the error
          connection.release()
          logger.error("Problem getting games from league: ", err);
          res.status(400).send('Problem getting games from league');
        } else {
          // if there is no error with the query, release the connection instance
          res.send(result);
          connection.release()

        }
      });
    }
  });
});

//get number of games a player has played in
app.get('/player/gamesCount', async (req, res) => {
  // obtain a connection from our pool of connections
  pool.getConnection(function (err, connection) {
    if (err) {
      console.log(connection);
      // if there is an issue obtaining a connection, release the connection instance and log the error
      logger.error('Problem obtaining MySQL connection', err)
      res.status(400).send('Problem obtaining MySQL connection');
    } else {
      var firstName = req.param('firstName');
      var lastName = req.param('lastName');
      connection.query("select count(*) from Players P join Teams T on P.TeamID = T.TeamID join Games G on T.TeamID = G.Team1ID or T.TeamID=G.Team2ID where P.FirstName=? and P.LastName=?", [firstName, lastName], function (err, result, fields) {
        if (err) {
          // if there is an error with the query, release the connection instance and log the error
          connection.release()
          logger.error("Problem getting ppg: ", err);
          res.status(400).send('Problem getting ppg');
        } else {
          // if there is no error with the query, release the connection instance
          res.send(result);
          connection.release()

        }
      });
    }
  });
});

//delete player given players first and last name
app.delete('/player', async (req, res) => {
  // obtain a connection from our pool of connections
  pool.getConnection(function (err, connection) {
    if (err) {
      console.log(connection);
      // if there is an issue obtaining a connection, release the connection instance and log the error
      logger.error('Problem obtaining MySQL connection', err)
      res.status(400).send('Problem obtaining MySQL connection');
    } else {
      var firstName = req.param('firstName');
      var lastName = req.param('lastName');
      connection.query("delete from Players where FirstName=? and LastName=?", [firstName, lastName], function (err, result, fields) {
        if (err) {
          // if there is an error with the query, release the connection instance and log the error
          connection.release()
          logger.error("Problem getting ppg: ", err);
          res.status(400).send('Problem getting ppg');
        } else {
          // if there is no error with the query, release the connection instance
          res.send(result);
          connection.release()

        }
      });
    }
  });
});

//update players name
app.put('/player/name', async (req, res) => {
  // obtain a connection from our pool of connections
  pool.getConnection(function (err, connection) {
    if (err) {
      console.log(connection);
      // if there is an issue obtaining a connection, release the connection instance and log the error
      logger.error('Problem obtaining MySQL connection', err)
      res.status(400).send('Problem obtaining MySQL connection');
    } else {
      var firstName = req.body.firstName;
      var lastName = req.body.lastName;
      var playerID = req.body.playerID;
      connection.query("update Players set FirstName=?,LastName=? where PlayerID=?", [firstName, lastName, playerID], function (err, result, fields) {
        if (err) {
          // if there is an error with the query, release the connection instance and log the error
          connection.release()
          logger.error("Problem getting ppg: ", err);
          res.status(400).send('Problem getting ppg');
        } else {
          // if there is no error with the query, release the connection instance
          res.send(result);
          connection.release()

        }
      });
    }
  });
});

app.get('/team/adCount', (req, res) => {
  // obtain a connection from our pool of connections
  pool.getConnection(function (err, connection) {
    if (err) {
      console.log(connection);
      // if there is an issue obtaining a connection, release the connection instance and log the error
      logger.error('Problem obtaining MySQL connection', err)
      res.status(400).send('Problem obtaining MySQL connection');
    } else {
      var teamID=req.param('teamID');
      connection.query("select adCount from Teams where TeamID=?", teamID, function (err, result, fields) {
        if (err) {
          // if there is an error with the query, release the connection instance and log the error
          connection.release()
          logger.error("Problem getting ppg: ", err);
          res.status(400).send('Problem getting ppg');
        } else {
          // if there is no error with the query, release the connection instance
          res.send(result);
          connection.release()

        }
      });
    }
  });
});

//update adCount
app.put('/team/adCount', (req, res) => {
  // obtain a connection from our pool of connections
  pool.getConnection(function (err, connection) {
    if (err) {
      console.log(connection);
      // if there is an issue obtaining a connection, release the connection instance and log the error
      logger.error('Problem obtaining MySQL connection', err)
      res.status(400).send('Problem obtaining MySQL connection');
    } else {
      var teamID=req.body.teamID;
      var adCount=req.body.adCount;
      connection.query("update Teams set adCount=? where TeamID=?",[adCount,teamID], function (err, result, fields) {
        if (err) {
          // if there is an error with the query, release the connection instance and log the error
          connection.release()
          logger.error("Problem getting ppg: ", err);
          res.status(400).send('Problem getting ppg');
        } else {
          // if there is no error with the query, release the connection instance
          res.send(result);
          connection.release()

        }
      });
    }
  });
});

//get game date given gameid
app.get('/game/date', (req, res) => {
  // obtain a connection from our pool of connections
  pool.getConnection(function (err, connection) {
    if (err) {
      console.log(connection);
      // if there is an issue obtaining a connection, release the connection instance and log the error
      logger.error('Problem obtaining MySQL connection', err)
      res.status(400).send('Problem obtaining MySQL connection');
    } else {
      var gameID=req.param('gameID');
      connection.query("select Date from Games where GameID=?",gameID, function (err, result, fields) {
        if (err) {
          // if there is an error with the query, release the connection instance and log the error
          connection.release()
          logger.error("Problem getting ppg: ", err);
          res.status(400).send('Problem getting ppg');
        } else {
          // if there is no error with the query, release the connection instance
          res.send(result);
          connection.release()

        }
      });
    }
  });
});

app.post('/game/update', (req, res) => {
  // obtain a connection from our pool of connections
  pool.getConnection(function (err, connection) {
    if (err) {
      console.log(connection);
      // if there is an issue obtaining a connection, release the connection instance and log the error
      logger.error('Problem obtaining MySQL connection', err)
      res.status(400).send('Problem obtaining MySQL connection');
    } else {
      var team1ID=req.body.team1ID;
      var team2ID=req.body.team2ID;
      var team1Score=req.body.team1Score;
      var team2Score=req.body.team2Score;
      var winnerID=req.body.winnerID;
      var date=req.body.date;
      connection.query("insert into Games(Team1ID, Team2ID, Team1Score, Team2Score, WinnerID, Date) VALUES(?,?,?,?,?,?)",[team1ID,team2ID,team1Score,team2Score,winnerID,date], function (err, result, fields) {
        if (err) throw err;
        else{
          res.send(result);
        }
      });
      //update team1ID wins
      connection.query("update Teams set Wins=(select count(WinnerID) from Games where WinnerID=?) where TeamID=?",[team1ID,team1ID], function (err, result, fields) {
        if (err) throw err;
      });
      //update team1ID losses
      connection.query("update Teams set Losses = (select count(GameID) from Games where WinnerID!=? and (Team1ID=? or Team2ID=?)) where TeamID=?",[team1ID,team1ID,team1ID,team1ID], function (err, result, fields) {
        if (err) throw err;
      });
      //update team2ID wins
      connection.query("update Teams set Wins=(select count(WinnerID) from Games where WinnerID=?) where TeamID=?",[team2ID,team2ID], function (err, result, fields) {
        if (err) throw err;
      });
      //update team2ID losses
      connection.query("update Teams set Losses = (select count(GameID) from Games where WinnerID!=? and (Team1ID=? or Team2ID=?)) where TeamID=?",[team2ID,team2ID,team2ID,team2ID], function (err, result, fields) {
        if (err) throw err;
      });
      connection.release();
    }
  });
});

}

