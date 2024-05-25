import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
axios.defaults.withCredentials = true
import { Typography, Grid, FormControl, InputLabel, Input, Button, TextField } from '@material-ui/core';
import { SERVER_URL } from '../../config';

function LoginRegister({ loginUser, onLoginUserChange }) {
    const navigate = useNavigate();

    const [showLogin, setShowLogin] = useState(true); 

    const [state, setState] = useState({
        loginId: '',
        email: '',
        password: '',
        loginMessage: '',
    });

    const handleInputChange = ({ target }) => {
        setState({ ...state, [target.name]: target.value });
    };

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        axios
            .post(`${SERVER_URL}/admin/login`, {
                email: state.email,
                passwordClearText: state.password,
            })
            .then((response) => {
                setState({ ...state, loginId: response.data.id }); 
                onLoginUserChange(response.data);
            })
            .catch((error) => {
                setState({ ...state, loginMessage: error.response.data.message });
                onLoginUserChange(null);
            });
    };

    const getNewUser = () => {
        const newUser = {
            email: state.newEmail,
            passwordClearText: state.newPassword,
            first_name: state.firstName,
            last_name: state.lastName,
            phone_number: state.phone_number,
        };

        setState({
            ...state,
            newEmail: '',
            newPassword: '',
            newPassword2: '',
            firstName: '',
            lastName: '',
            phone_number: '',
        });

        return newUser;
    };


    const handleRegisterSubmit = (e) => {
        e.preventDefault();

        if (state.newPassword !== state.newPassword2) {
            setState({ ...state, registeredMessage: 'The two passwords are NOT the same, please try again' });
            return;
        }

        axios
            .post(`${SERVER_URL}/user`, getNewUser())
            .then((response) => {
                console.log('** LoginRegister: new User register Success! **');
                setState({ ...state, registeredMessage: response.data.message });
            })
            .catch((error) => {
                console.log('** LoginRegister: new User loggin Fail! **');
                setState({ ...state, registeredMessage: error.response.data.message });
            });
    };

    const customForm = (inputLabel, id, type, value, required, autoFocus = false, error = false, helperText = '') => {
        return (
            <TextField
                id={id}
                variant="outlined"
                fullWidth
                required={required}
                label={inputLabel}
                name={id}
                autoComplete={id}
                type={type}
                value={value}
                onChange={handleInputChange}
                autoFocus={autoFocus}
               
                style={{marginBottom: "15px", backgroundColor: "#f9fafb"}}
            />
        );
    };

    if (loginUser) {
        navigate(`${SERVER_URL}/users/${state.loginId}`);
    }

    return (
        <Grid container justifyContent="center" alignItems="center" style={{ height: '100vh' }}>
            <Grid item style={{ maxWidth: 400, width: '100%' }}>
                <Grid container direction="column" spacing={2}>
                    <Grid item>
                        <Typography variant="h4" align="center"style={{ fontWeight: 'bold' }}>
                            {showLogin ? 'Log into your account' : 'Create an account'}
                        </Typography>
                    </Grid>
                    
                    <Grid item>
                        <form onSubmit={showLogin ? handleLoginSubmit : handleRegisterSubmit} style={{ width: '100%' }}>
                            {showLogin ? (
                                <>
                                    {customForm('Email', 'email', 'text', state.email, true)}
                                    {customForm('Password', 'password', 'password', state.password, true)}
                                </>
                            ) : (
                                <>
                                    {customForm('Email', 'newEmail', 'text', state.newEmail, true)}
                                    {customForm('First Name', 'firstName', 'text', state.firstName, true)}
                                    {customForm('Last Name', 'lastName', 'text', state.lastName, true)}
                                    {customForm('Phone Number', 'phone_number', 'text', state.phone_number)}
                                    {customForm('Password', 'newPassword', 'password', state.newPassword, true)}
                                    {customForm('Verify Password', 'newPassword2', 'password', state.newPassword2, true)}
                                </>
                            )}
                            <br />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                style={{backgroundColor: "rgb(0, 0, 0)", height: 50, borderRadius: 10, marginTop: 10}}
                            >
                                {showLogin ? 'Login' : 'Register'}
                            </Button>
                            <br />
                            <br />
                            {showLogin ? (
                                state.loginMessage && <Typography style={{ color: 'red' }}>{state.loginMessage}</Typography>
                            ) : (
                                state.registeredMessage && (
                                    <Typography style={{ color: state.registeredMessage.includes('successfully') ? 'green' : 'red' }}>
                                        {state.registeredMessage}
                                    </Typography>
                                )
                            )}
                            <br />
                            <span
                                style={{
                                    color: "#0f0f0f",
                                    cursor: "pointer",
                                    textDecoration: "none",
                                    transition: "text-decoration 0.2s"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                                onClick={() => setShowLogin(!showLogin)}
                                >
                                {showLogin ? 'Create New Account' : 'Already have an account? Log In'}
                            </span>
                        </form>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
}

export default LoginRegister;
