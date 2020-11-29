require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const gql = require('graphql-tag');
const { buildASTSchema } = require('graphql');
const { Client } = require('@okta/okta-sdk-nodejs');
const OktaJwtVerifier = require('@okta/jwt-verifier');

const oktaJwtVerifier = new OktaJwtVerifier({
    clientId: process.env.REACT_APP_OKTA_CLIENT_ID,
    issuer: `${process.env.REACT_APP_OKTA_ORG_URL}/oauth2/default`,
});

const client = new Client({
    orgUrl: process.env.REACT_APP_OKTA_ORG_URL,
    token: process.env.REACT_APP_OKTA_TOKEN,
});

const AUTHORS = {
    1: { id: 1, name: "John Doe" },
    2: { id: 2, name: "Jane Doe" },
}

const POSTS = [
    { 
        authorId: "1", 
        title: "Golden Bridge", 
        body: "The Golden Gate Bridge is a suspension bridge spanning the Golden Gate, the one-mile-wide (1.6 km) strait connecting San Francisco Bay and the Pacific Ocean. The structure links the U.S. city of San Francisco, California—the northern tip of the San Francisco Peninsula—to Marin County, carrying both U.S. Route 101 and California State Route 1 across the strait. The bridge is one of the most internationally recognized symbols of San Francisco and California. It was initially designed by engineer Joseph Strauss in 1917. It has been declared one of the Wonders of the Modern World by the American Society of Civil Engineers.", 
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/540px-GoldenGateBridge-001.jpg"
    },
    { 
        authorId: "2", 
        title: "Great Wall of China", 
        body: "The Great Wall of China is the collective name of a series of fortification systems generally built across the historical northern borders of China to protect and consolidate territories of Chinese states and empires against various nomadic groups of the steppe and their polities. Several walls were being built from as early as the 7th century BC by ancient Chinese states;[2] selective stretches were later joined together by Qin Shi Huang (220–206 BC), the first emperor of China. Little of the Qin wall remains.[3] Later on, many successive dynasties have built and maintained multiple stretches of border walls. The most well-known sections of the wall were built by the Ming dynasty (1368–1644).", 
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/The_Great_Wall_of_China_at_Jinshanling-edit.jpg/480px-The_Great_Wall_of_China_at_Jinshanling-edit.jpg"
    },
];

const schema = buildASTSchema(gql`
    type Query {
        posts: [Post]
        post(id: ID): Post
    }

    type Post {
        id: ID
        author: Author
        title: String
        body: String
        img: String
    }

    type Mutation {
        submitPost(input: PostInput!): Post
    }

    type Author {
        id: ID
        name: String
    }

    input PostInput {
        id: ID
        title: String!
        body: String!
        img: String
    }
`);

const mapPost = (post, id) => post && ({ 
    ...post,
    id,
    author: AUTHORS[post.authorId]    
});

const getUserId = async ({ authorization }) => {
    try {
        const accessToken = authorization.trim().split(' ')[1];
        const { claims: { uid } } = await oktaJwtVerifier.verifyAccessToken(accessToken);

        if (!AUTHORS[uid]) {
            const { profile: { firstName, lastName } } = await client.getUserId(uid);

            AUTHORS[uid] = {
                id: uid,
                name: [firstName, lastName].filter(Boolean).join(' '),
            };
        }

        return uid;
    } catch (error) {
        console.log(error);
        return null;
    }
};

const root = {
    posts: () => POSTS.map(mapPost),
    post: ({ id }) => mapPost(POSTS[id], id),

    submitPost: async ({ input: { id, title, body, img } }, { headers }) => {
        const authorId = await getUserId(headers);
        if (!authorId) return null;

        const post = { authorId, title, body, img };
        let index = POSTS.length;

        if (id != null && id >= 0 && id < POSTS.length) {
            if (POSTS[id].authorId !== authorId) return null;

            POSTS.splice(id, 1, post);
            index = id;
        } else {
            POSTS.push(post);
        }

        return mapPost(post, index);
    },
};

const app = express();
app.use(cors());
app.use('/graphql', graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
}));

const port = process.env.PORT || 4000
app.listen(port);
console.log(`Running a GraphQL API server at localhost:${port}/graphql`);