import React, { useState } from 'react';
import { Routes, Link } from 'react-router-dom';

import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";

import Container from "react-bootstrap/Container"

export class Homepage extends React.Component {
    testValue = 4;


    state = {
        loggedInUser: undefined
    }

    componentDidMount() {
        var loggedInUser = localStorage.getItem("adminLogin");
        console.log("didmount", loggedInUser);
        if (typeof loggedInUser === undefined) {
            localStorage.setItem('adminLogin', false);
            console.log("Set login to false");
            loggedInUser = false;
            this.setState({ loggedInUser: false });
        }
        else
            this.setState({ loggedInUser: loggedInUser });
    }

    

    setLogin = (param) => {
        this.setState({ loggedInUser: param });
    }
    render() {
        return (
            <>
                <Navbar bg="dark" variant="dark">
                    <Container>
                        <Navbar.Brand>SportsTeamWebsite</Navbar.Brand>
                        <Nav className="me-auto">
                            <Nav.Link href="/home">Home</Nav.Link>
                            <Nav.Link href="/NBA">NBA</Nav.Link>
                            <Nav.Link href="/NFL">NFL</Nav.Link>
                            <Nav.Link href="/MLB">MLB</Nav.Link>
                        </Nav>
                        {console.log("login", this.state.loggedInUser)}
                        {this.state.loggedInUser=="true"
                            ? (
                                <>
                            <Nav.Link href="/logout" className="mr-auto">LogOut</Nav.Link>
                            <Nav.Link href="/dashboard" className="mr-auto">Admin Dashboard</Nav.Link>
                            </>
                            )
                            : (<Nav.Link href="/login" className="mr-auto">Login </Nav.Link>)
                        }



                    </Container>
                </Navbar>


                <h1>Sports League</h1>
                <h2>What league do you want to explore?</h2>

                <div>
                    <Link to="/NBA">
                        <img src="https://upload.wikimedia.org/wikipedia/en/0/03/National_Basketball_Association_logo.svg" to="/NBA"></img>
                    </Link>
                </div>
                <div>
                    <Link to="/NFL">
                        <img src="https://upload.wikimedia.org/wikipedia/en/a/a2/National_Football_League_logo.svg"></img>
                    </Link>
                </div>
                <div>
                    <Link to="/MLB">
                        <img src="https://upload.wikimedia.org/wikipedia/en/a/a6/Major_League_Baseball_logo.svg"></img>
                    </Link>
                </div>
            </>
        )
    }
}

export default Homepage;