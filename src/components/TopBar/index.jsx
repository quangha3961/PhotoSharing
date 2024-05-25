import React, { useState, useEffect }  from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";
import "./TopBar.css";
import axios from "axios";
axios.defaults.withCredentials = true
import { CloseRounded } from "@material-ui/icons";
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import { SERVER_URL } from '../../config';


function TopBar(props) {
  const [version, setVersion] = useState(null);         
  const [logoutPrompt, setlogoutPrompt] = useState(null);

  const [alertPromptOpen, setAlertPromptOpen] = useState(false); 
  const handleAlertOpen = () => setAlertPromptOpen(true);
  const handleAlertClose = () => setAlertPromptOpen(false);

  const axios_fetchVersion = () => {
    axios
        .get(`${SERVER_URL}/test/info`, {
          withCredentials: true
        }) 
        .then(response => {
          setVersion(response.data.version);
        })
        .catch(err => console.error("Error: logout error in posting...", err.message));
  };

  const axios_logoutUser = () => {
    axios
      .post(`${SERVER_URL}/admin/logout`)
      .then(response => {
        if (response.status === 200) {
          console.log("** TopBar: log out OK **");
          props.onLoginUserChange(null);
          window.location.href = '/';
        }
      })
      .catch(err => console.log("Error: logout error in posting", err.message));
  };

  useEffect(() => {
    axios_fetchVersion();
  }, [props.loginUser]); 


  // close snackbar when clickaway or openSnackbar is false.
  const handleLogoutPromptClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setlogoutPrompt(false);
  };


  // Actions for logout account button: will log out user and display prompt for user to log in
  const handleLogoutPromptClick = () => {
    axios_logoutUser();    // Use Axios to send POST request to log out user.
    setlogoutPrompt(true); // show snackbar when logout button is clicked on login page
  };

  const handleDeleteClick = () => {
    setAlertPromptOpen(false);      // close the alert prompt
    axios
      .post(`${SERVER_URL}/deleteUser/${props.loginUser.id}`)
      .then(response => {
        if (response.status === 200) {
          console.log("** TopBar: Delete Account OK **");
          handleLogoutPromptClick(); // after deleting user account, need to log out the user.
        }
      })
      .catch(err => console.log("Delete account error: ", err.message));
  };

  // Rendering Components:
  return (
    <AppBar
      className="topbar-appBar"
      position="fixed"
      style={{ backgroundColor: "#000000" }}
    >
      <Toolbar>
        <Typography variant="h4" style={{ flexGrow: 1, color: "rgb(227 230 233)",fontWeight: "bold",
    fontFamily: "Times New Roman" }}>
          Sharing Motion
          
        </Typography>
        {props.loginUser && (
          <h7 style={{
            color: "rgb(227 230 233)",
            fontStyle: "italic",
            position: "absolute",
            right: 0,
            bottom: 0,
            marginRight: 10,
          }}>
          Version: {version}
          </h7>
        )}
        <React.Fragment>
          {/* Logout button and styles */}
          <IconButton title="Log out your account" onClick={handleLogoutPromptClick} variant="contained" >
            <LogoutIcon style={{ color: "#fff" }} fontSize="medium" />
          </IconButton>
          {/* to prompt user when already logged out */}
          <Snackbar
            open={logoutPrompt}
            onClose={handleLogoutPromptClose}
            autoHideDuration={5000}
            message="You are currently logged out."
            action={(
              <IconButton color="secondary" onClick={handleLogoutPromptClose}>
                <CloseRounded />
              </IconButton>
            )}
          />
        </React.Fragment>


        {/* Account Delete Button */}
        {props.loginUser && (
          <React.Fragment>
            {/*<IconButton title="Delete your account forever" onClick={handleAlertOpen} variant="contained" >*/}
            {/*  <DeleteForeverIcon style={{ color: "red" }} fontSize="medium" />*/}
            {/*</IconButton>*/}
            <Dialog
              open={alertPromptOpen}
              onClose={handleAlertClose}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">
                {"Deleting an Account"}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  {`Delete ${props.loginUser.first_name} ${props.loginUser.last_name}'s account?`}
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleAlertClose} autoFocus color="primary" variant="contained">Cancel</Button>
                <Button onClick={handleDeleteClick} color="secondary">Delete</Button>
              </DialogActions>
            </Dialog>
          </React.Fragment>
        )}

      </Toolbar>
    </AppBar>
  );
}

export default TopBar;