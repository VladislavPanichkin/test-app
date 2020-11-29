import React, { Component } from "react";
import { Button, Container } from "reactstrap";

import "./App.css";
import PostViewer from "./components/PostViewer";
import PostEditor from "./components/PostEditor";
import withAuth from "./withAuth";

class App extends Component {
  state = {
    editing: null,
  };

  render() {
    const { auth } = this.props;
    if (auth.loading) return null; //here can be a loader
    
    const { user, login, logout } = auth;
    const { editing } = this.state;

    return (
      <Container fluid>
        {user ? (
          <div>
            <Button
              className="my-2"
              color="primary"
              onClick={(() => this.setState({ editing: {} }))}
            >
              New Post
            </Button>
            <Button className="my-2" color="secondary" onClick={() => logout()}>
              Sing out (signed in as {user.name})
            </Button>
            <PostViewer
          canEdit={(post) => user && user.sub === post.author.id}
          onEdit={(post) => this.setState({ editing: post })}
        />
        {editing && (
          <PostEditor
            post={editing}
            onClose={() => this.setState({ editing: null })}
          />
        )}
          </div>
        ) : (
          <Button className="my-2" color="primary" onClick={() => login()}>
            Sing In
          </Button>
        )}
      </Container>
    );
  }
}
export default withAuth(App);
