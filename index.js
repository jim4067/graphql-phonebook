const { gql, ApolloServer, UserInputError } = require('apollo-server');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Person = require('./models/person');
const User = require('./models/user');

const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY';

const MONGODB_URI = 'mongodb+srv://fullstack:halfstack@cluster0-ostce.mongodb.net/graphql?retryWrites=true';

console.log("Connecting to mongoDB", MONGODB_URI);

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
    .then(() => {
        console.log("connected to mongodb");
    })
    .catch((error) => {
        console.log("error connecting to mongoDB", error.message);
    });

const typeDefs = gql`
  type Address {
    city: String!
    street: String!
  }

  type Person {
    name: String!
    phone: String
    address: Address!
    id: ID!
  }

  type User {
    username: String!
    friends: [Person!]!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String     
      street: String!
      city: String!
    ): Person
    editNumber(name: String!, phone: String!): Person
    createUser(username: String!): User
    login(username: String!, password: String!): Token
  }

  enum YesNo {
    YES
    NO
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person!]!
    findPerson(name: String!): Person
    me: User
  }
`;

const resolvers = {
    Query: {
        personCount: () => Person.collection.countDocuments(),
        allPersons: (root, args) => {
            if (!args.phone) {
                return Person.find({});
            }
            return Person.find({ phone: { $exists: args.phone === 'YES' } });
        },
        findPerson: (root, args) =>
            Person.findOne({ name: args.name })
    },

    Person: {
        address: (root) => {
            return {
                city: root.city,
                street: root.street
            }
        }
    },
    me: (root, args, context) => {
        return context.currentUser;
    },

    //getting random error of mutation returning null. Find out why?
    Mutation: {
        addPerson: async (root, args) => {
            const person = new Person({ ...args });

            try {
                await person.save();
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args
                })
            }
            return person;
        },
        editNumber: async (root, args) => {
            const person = await Person.findOne({ name: args.name });
            person.phone = args.phone;

            try {
                await person.save();
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args
                })
            }
            return person;
        },
        createUser: async (root, args) => {
            const user = new User({ username: args.username });

            return user.save()
                .catch((error) => {
                    throw new UserInputError(error.message, {
                        args: invalidArgs
                    })
                })
        },
        login: async (root, args) => {
            const user = await User.findOne({ username: args.username });

            if (!user || args.password !== 'secred') {
                throw new UserInputError('wrong credentials');
            }

            const userForToken = {
                username: user.username,
                id: user._id
            }

            return { value: jwt.sign(userForToken, JWT_SECRET) }
        },
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    // the object returned by context is given to all resolvers as their third parameter
    context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null;
        if (auth && auth.toLowerCase().startsWith('bearer ')) {
            const decoded_token = jwt.verify(
                auth.substring(7), JWT_SECRET
            )
            const currentUser = await (await User.findById(decoded_token.id)).populated('friends');
            return currentUser;
        }
    }
});

server.listen().then(({ url }) => {
    console.log(`server ready at url ${url}`)
});