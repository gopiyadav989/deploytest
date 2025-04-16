import { createClient } from "@clickhouse/client";

const createClickhouseClient = (config) => {
    const {
        host = process.env.CLICKHOUSE_HOST || 'play.clickhouse.com',
        port = process.env.CLICKHOUSE_PORT || 443,
        protocol = process.env.CLICKHOUSE_PROTOCOL || 'https',
        username = process.env.CLICKHOUSE_USER || 'explorer',
        password = process.env.CLICKHOUSE_PASSWORD || '',
        database = process.env.CLICKHOUSE_DEFAULT_DATABASE || 'default',
        jwt = ''
    } = config;

    const connectionConfig = {
        host: `${protocol}://${host}:${port}`,
        database
    };

    // If JWT is provided, set it in the application headers
    // and clear the password field
    if (jwt) {
        connectionConfig.password = '';
        connectionConfig.application = {
            headers: {
                Authorization: `Bearer ${jwt}`
            }
        };
    } else if (password) {
        connectionConfig.username = username;
        connectionConfig.password = password;
    }

    return createClient(connectionConfig);
};


export default createClickhouseClient;


// Usage example
// If using JWT token (ClickHouse Cloud):
// host
// database
// jwt — as Authorization: Bearer <token> in headers

// If using username/password:
// host
// database
// username
// password