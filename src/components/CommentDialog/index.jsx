import React, { useState }  from "react";
import { Button, Dialog, DialogContent, DialogContentText, TextField, DialogActions, Chip } from "@material-ui/core";
import { Send } from "@material-ui/icons"
import axios from "axios";
axios.defaults.withCredentials = true
import { SERVER_URL } from '../../config';

function CommentDialog(props) {
    const [open, setOpen] = useState(false);
    const [comment, setComment] = useState("");
    const handleCommentChange = event => setComment(event.target.value);

    const handleCommentSubmit = () => {
        const commentText = comment;
        setComment("");
        setOpen(false);
        axios
            .post(`${SERVER_URL}/commentsOfPhoto/${props.photo_id}`, { comment: commentText })
            .then(() => props.onCommentSumbit())                
            .catch(err => console.log("Comment Sent Failure: ", err));
    };
    return (
        <div className="comment-dialog" style={{ display: "flex", alignItems: "center" }}>
            <textarea
                value={comment}
                onChange={handleCommentChange}
                placeholder="Add a comment..."
                style={{
                    flex: 1,
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    padding: "8px",
                    resize: "none",
                    height: "50px"
                }}
            />
            <Send
                onClick={handleCommentSubmit}
                style={{ color: "#0063da", marginLeft: 10 }}
            >
                Send
            </Send>
        </div>
    );
}

export default CommentDialog;