import { url } from "../utils/url";
import axios from "axios"

export class SportRepository {

    config = {
    };

    async getAllGames(league_name) {
        return await new Promise((resolve,reject)=>{
        axios.get(`http://${url}:8000/games/leagueDESC`,
            {params: {league:league_name}}
          )
            .then(x => {
                resolve(x.data);
            })
            .catch(x => {
                alert(x);
                reject(x);
            })
        });
    }

    getTeamName1FromGameID(id) {
        // let config = this.config;
        // if (params) {
        //     config.params = params;
        // }
        return new Promise((resolve, reject) => {
            axios.get(`http://${url}:8000/games/team1?GameID=${id}`)
                .then(x => resolve(x.data))
                .catch(x => {
                    alert(x);
                    reject(x);
                })
        });
    }
    async getTeamName2FromGameID(id) {
        return await new Promise((resolve, reject) => {
            axios.get(`http://${url}:8000/games/team2?GameID=${id}`, {
            })
                .then(x => resolve(x.data))
                .catch(x => {
                    alert(x);
                    reject(x);
                })
        });
        }

}