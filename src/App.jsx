import React, {useEffect, useState} from "react";
import { Grid, Paper } from "@mui/material";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";

import TopBar from "./components/TopBar";
import UserDetail from "./components/UserDetail";
import UserList from "./components/UserList";
import UserPhotos from "./components/UserPhotos";
import LoginRegister from "./components/LoginRegister";
import axios from "axios";
axios.defaults.withCredentials = true
import {SERVER_URL} from "./config";

function App() {
  const [photoIsUploaded, setPhotoIsUploaded] = useState(false);
  const [userName, setUserName] = useState(null);
  const [loginUser, setLoginUser] = useState();

  const handleUserNameChange = (name) => {
    setUserName(name);
  };

  const handleLoginUserChange = (user) => {
    setLoginUser(user);
  };

  const handlePhotoUpload = () => {
    setPhotoIsUploaded(true);
  };

  useEffect(() => {
    if (!loginUser) {
      fetchUserData();
    }
  }, [loginUser]);

  const fetchUserData = () => {
    axios
        .post(`${SERVER_URL}/validate-session`, {},{
          withCredentials: true
        })
        .then(response => {
          setLoginUser(response);
        })
  };

  return (
      <Router>
        <div className="font-sans">
          <TopBar
              onLoginUserChange={handleLoginUserChange}
              onPhotoUpload={handlePhotoUpload}
              userName={userName}
              loginUser={loginUser}
          />
          <div>
            {loginUser ? (
                <div>
                  <div style={{height: "56px"}}></div>
                  <Grid container spacing={2}>
                    <Grid item sm={2} style={{ paddingLeft: 25, paddingRight: 0 }}>
                      <Paper className="side-bar bg-abd1c6 m-3" elevation={3} style={{ boxShadow: "none" }}>
                        <UserList loginUser={loginUser} />
                      </Paper>
                    </Grid>
                    <Grid item sm={10} style={{ paddingLeft: 5, paddingRight: 0, paddingBottom: 0 }}>
                      <Paper className="main-grid-item bg-abd1c6 h-full mt-1 mr-2" elevation={3} style={{ backgroundColor: "#ffffff", height: '100%', marginTop: '0.5%', border: "0.1px solid #e5e5e5", boxShadow: "none", background: '#ffffff'}}>
                        <Routes>
                          <Route
                              path="/users/:userId"
                              element={<UserDetail onUserNameChange={handleUserNameChange} onLoginUserChange={handleLoginUserChange} onPhotoUpload={handlePhotoUpload} loginUser={loginUser} />}
                          />
                          <Route
                              path="/photos/:userId"
                              element={<UserPhotos onUserNameChange={handleUserNameChange} onLoginUserChange={handleLoginUserChange} loginUser={loginUser} photoIsUploaded={photoIsUploaded} />}
                          />
                          <Route path="*" element={<Navigate to={`/users/${loginUser.id}`} />} />
                        </Routes>
                      </Paper>
                    </Grid>
                  </Grid>
                </div>
            ) : (
                <LoginRegister onLoginUserChange={handleLoginUserChange} loginUser={loginUser} />
            )}
          </div>
        </div>
      </Router>
  );
}

export default App;
