const { gql, ApolloServer } = require('apollo-server');

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

  type Query {
    personCount: Int!
    allPersons: [Person!]!
    findPerson(name: String!): Person
  }
`;

const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: () => persons,
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