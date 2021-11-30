import React, { useState, Component } from 'react';
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Table from "react-bootstrap/Table";
import { NavDropdown, Form, Button, Modal, Image } from 'react-bootstrap';
import { SportRepository } from '../api/SportRepository';
import Container from "react-bootstrap/Container"
import { Ads } from './Ads';

export class Teamview extends React.Component {
    db = new SportRepository();
    loggedInUser = localStorage.getItem("adminLogin");
    constructor() {
        super();
        this.state = {
            allplayers: [],
            searchPlayer: [],
            namesearch: "",
            show: false
        }
        this.showModal = this.showModal.bind(this);
        this.hideModal = this.hideModal.bind(this);
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
        else {
            this.setState({ loggedInUser: loggedInUser });
        }
        let TeamID = this.props.match.params.teamID;
        if (TeamID) {
            this.db.getPlayersFromTeam(TeamID).then(allplayers => this.setState({ allplayers: allplayers, searchPlayer: allplayers }));
        }
    }
    sortPlayersbyPPG(players) {
        this.setState(players.sort((a, b) => a.PPG < b.PPG ? 1 : -1));
    }

    sortPlayersbyName(players) {
        this.setState(players.sort((a, b) => a.LastName > b.LastName ? 1 : -1));
    }

    sortPlayersbyPosition(players) {
        this.setState(players.sort((a, b) => a.Position > b.Position ? 1 : -1));
    }

    async searchPlayer(name) {
        console.log(name)
        await this.setState({ searchPlayer: this.state.allplayers })
        var players = await this.state.searchPlayer.filter(player => player.FirstName.includes(name));
        this.setState({ searchPlayer: players });
    }

    showModal = () => {
        this.setState({ show: true });
    };

    hideModal = () => {
        this.setState({ show: false });
    };

    render() {
        if (!this.state.allplayers) {
            return <div>Loading...</div>
        }
        return (
            <>
                <Navbar expand="lg" bg="dark" variant="dark">
                    <Container fluid>
                        <Navbar.Brand>SportsTeamWebsite</Navbar.Brand>
                        <Navbar.Toggle aria-controls="basic-navbar-nav" />
                        <Navbar.Collapse id="navbar-white-example">
                            <Nav className="me-auto">
                                <Nav.Link href="/home">Home</Nav.Link>
                                <Nav.Link href="/NBA">NBA</Nav.Link>
                                <Nav.Link href="/NFL">NFL</Nav.Link>
                                <Nav.Link href="/MLB">MLB</Nav.Link>
                            </Nav>
                            <Nav className="mr-auto">
                                {console.log("login", this.state.loggedInUser)}
                                {this.state.loggedInUser == "true"
                                    ? (
                                        <>
                                            <Nav.Link href="/logout" className="mr-auto">LogOut</Nav.Link>
                                            <Nav.Link href="/dashboard" className="mr-auto">Admin Dashboard</Nav.Link>
                                        </>
                                    )
                                    : (<Nav.Link href="/login" className="mr-auto">Login </Nav.Link>)
                                }
                            </Nav>

                        </Navbar.Collapse>
                    </Container>
                </Navbar>

                <Navbar variant="white" bg="white" expand="lg">
                    <Container fluid>
                        <Navbar.Brand >Team Roster</Navbar.Brand>
                        <Navbar.Toggle aria-controls="basic-navbar-nav" />
                        <Navbar.Collapse id="basic-navbar-nav">
                            <Nav class="me-auto">
                                <NavDropdown
                                    id="basic-nav-dropdown"
                                    title="Sort Players By"
                                    menuVariant="white"
                                >
                                    <NavDropdown.Item onClick={() => { this.sortPlayersbyName(this.state.searchPlayer) }}>Last Name</NavDropdown.Item>
                                    <NavDropdown.Item onClick={() => { this.sortPlayersbyPPG(this.state.searchPlayer) }}>Points Per Game</NavDropdown.Item>
                                    <NavDropdown.Item onClick={() => { this.sortPlayersbyPosition(this.state.searchPlayer) }}>Position</NavDropdown.Item>
                                </NavDropdown>
                            </Nav>
                        </Navbar.Collapse>
                        <Form>
                            <Form.Group className="mb-3" >
                                <Form.Control type="text" onChange={e => this.setState({ namesearch: e.target.value })} placeholder="Search For Player" />
                            </Form.Group>
                            <Button variant="primary" onClick={() => { this.searchPlayer(this.state.namesearch) }}>
                                Search
                            </Button>
                        </Form>
                    </Container>

                </Navbar>

                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Player Name</th>
                            <th>Position</th>
                            <th>Points Per Game</th>
                            <th>Player Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.state.searchPlayer.map(player =>
                                <tr>
                                    <td>{player.PlayerNumber}</td>
                                    <td>{player.FirstName} {player.LastName}</td>
                                    <td>{player.Position}</td>
                                    <td>{player.PPG}</td>
                                    <button type="button" onClick={() => { this.showModal(); this.searchPlayer(player.FirstName) }}>
                                        Open
                                    </button>

                                    <Modal show={this.state.show} handleClose={this.hideModal} aria-labelledby="contained-modal-title-vcenter"
                                        centered>

                                        <Modal.Header closeButton onClick={() => { this.hideModal(); this.searchPlayer("") }}>
                                            <Modal.Title>{player.FirstName} {player.LastName}</Modal.Title>
                                        </Modal.Header>
                                        <Modal.Body>
                                            <div> <img src="http://snapbuilder.com/code_snippet_generator/image_placeholder_generator/300x300/808080/DDDDDD" /></div>

                                            <p>Player Number: {player.PlayerNumber}</p>
                                            <p>Position: {player.Position}</p>
                                            <p>PPG: {player.PPG}</p>
                                            <p>TimePlayed: {player.TimePlayed}</p>

                                        </Modal.Body>
                                        <Modal.Footer>
                                            <Button variant="secondary" onClick={() => { this.hideModal(); this.searchPlayer("") }}>
                                                Close
                                            </Button>
                                        </Modal.Footer>
                                    </Modal>
                                </tr>)
                        }
                    </tbody>
                </Table>


                {/* ads */}

                <Ads teamID={this.props.match.params.teamID} />
            </>
        )
    }
}