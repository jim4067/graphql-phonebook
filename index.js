const { gql, ApolloServer, UserInputError } = require('apollo-server');
const mongoose = require('mongoose');
const Person = require('./models/person');

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

  type Mutation {
      addPerson (
        name: String!
        phone: String
        street: String!
        city: String!
      ) : Person
      editNumber(
          name: String!
          phone: String!
      ) : Person
  }

  enum YesNo {
      YES
      NO
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person!]!
    findPerson(name: String!): Person
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
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

server.listen().then(({ url }) => {
    console.log(`server ready at url ${url}`)
});