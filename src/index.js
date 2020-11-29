import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter, Route } from "react-router-dom";
import { Security, ImplicitCallback } from "@okta/okta-react";

import "bootstrap/dist/css/bootstrap.min.css";
import client from "./apollo";

ReactDOM.render(
  <BrowserRouter>
    <Security
      issuer={"https://dev-8274050.okta.com/oauth2/default"}
      redirect_uri={`${window.location.origin}/implicit/callback`}
      client_id={"0oagjkx74MrjHltku5d5"}
    >
      <ApolloProvider client={client}>
        <Route path="/implicit/callback" component={ImplicitCallback} />
        <Route path="/" component={App} />
      </ApolloProvider>
    </Security>
  </BrowserRouter>,
  document.getElementById("root")
);

if (module.hot) module.hot.accept();