const { gql, ApolloServer, UserInputError } = require('apollo-server');
const { v1: uuid } = require('uuid');

let persons = [
    {
        name: "Homer Simpson",
        phone: "040-123543",
        street: "Tapiolankatu 5 A",
        city: "Espoo",
        id: "3d594650-3436-11e9-bc57-8b80ba54c431"
    },
    {
        name: "Marge Simpson",
        phone: "040-432342",
        street: "Malminkaari 10 A",
        city: "Helsinki",
        id: '3d599470-3436-11e9-bc57-8b80ba54c431'
    },
    {
        name: "Bart Simpson",
        street: "Nallemäentie 22 C",
        city: "Helsinki",
        id: '3d599471-3436-11e9-bc57-8b80ba54c431'
    },
];

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
        personCount: () => persons.length,
        allPersons: (root, args) => {
            if (!args.phone) {
                return persons;
            }
            const byPhone = (person) =>
                args.phone === 'YES' ? person.phone : !person.phone
            return persons.filter(byPhone)
        },
        findPerson: (root, args) =>
            persons.find(p => p.name === args.name)
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
        addPerson: (root, args) => {
            //throw UserInputError if the name is not unique
            if (persons.find(p => p.name === args.name)) {
                throw new UserInputError('Name must be unique', {
                    invalidArgs: args.name,
                });
            }

            const person = { ...args, id: uuid() };
            persons = persons.concat(person);
            return person;
        },
        editNumber: (root, args) => {
            const person = persons.find((p) => p.name === args.name)
            if (!person) {
                return null;
            }

            const updatedPerson = { ...person, phone: args.phone };
            person = persons.map((p) => p.name === args.name ? updatedPerson : p);
            return updatedPerson;
        }
    }

    // Address: {
    //     city: (root) => "New York",
    //     street: (root) => "Manhattan"
    // }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

server.listen().then(({ url }) => {
    console.log(`server ready at url ${url}`)
});