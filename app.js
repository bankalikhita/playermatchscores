const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbpath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const matchdetailsconvertion = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const playerdetailsconvertion = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const initializedb = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running");
    });
  } catch (e) {
    console.log(`DB ERROR:${e.message}`);
    process.exit(1);
  }
};
initializedb();

//allplayersfromtable API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
 SELECT
 *
 FROM
 player_details;`;
  const allplayersarray = await db.all(getPlayersQuery);
  response.send(allplayersarray.map((each) => playerdetailsconvertion(each)));
});

//singleplayer API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
 SELECT
 *
 FROM
 player_details where player_id=${playerId};`;
  const allplayersarray = await db.get(getPlayerQuery);
  response.send(playerdetailsconvertion(allplayersarray));
});

//updateplayer api 3
app.put("/players/:playerId/", async (request, response) => {
  const playerdetails = request.body;
  const { playerId } = request.params;
  const { playerName } = playerdetails;
  const getPlayerQuery = `UPDATE player_details set player_name='${playerName}' where player_id=${playerId};`;
  await db.get(getPlayerQuery);
  response.send("Player Details Updated");
});

//matchdetails api 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getdetailsQuery = `
 SELECT
 *
 FROM
 match_details where match_id=${matchId};`;
  const allplayersarray = await db.get(getdetailsQuery);
  response.send(matchdetailsconvertion(allplayersarray));
});

//matchdetailsofplayer api 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getdetailsQuery = `
 SELECT
 *
 FROM
 match_details natural join player_match_score where player_id=${playerId};`;
  const allplayersarray = await db.all(getdetailsQuery);
  response.send(allplayersarray.map((each) => matchdetailsconvertion(each)));
});

//playerdetails of match api 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getdetailsQuery = `
 SELECT
 player_details.player_id as playerId,
 player_details.player_name as playerName
 FROM
 player_match_score natural join player_details where match_id=${matchId};`;
  const allplayersarray = await db.all(getdetailsQuery);
  response.send(allplayersarray.map((each) => playerdetailsconvertion(each)));
});

//statsofplayer api7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const allplayersarray = await db.all(getPlayerScored);
  response.send(allplayersarray);
});

module.exports = app;
