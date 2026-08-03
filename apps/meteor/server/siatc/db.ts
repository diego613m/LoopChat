import sql from 'mssql';

// Conexión a la base Azure SQL compartida del Ecosistema SIATC (EBM.Users,
// EBM.PendingSSORequests) — mismo patrón que server/db.ts de las 10 apps
// (Etapa 6: usuarios de privilegio mínimo siatc_reader/siatc_writer).
const baseSqlConfig = {
	database: process.env.SIATC_DB_DATABASE,
	server: process.env.SIATC_DB_SERVER || '',
	pool: {
		max: 10,
		min: 0,
		idleTimeoutMillis: 30000,
	},
	requestTimeout: 30000,
	options: {
		encrypt: true,
		trustServerCertificate: true,
	},
};

const readSqlConfig = {
	...baseSqlConfig,
	user: process.env.SIATC_DB_USER_READ,
	password: process.env.SIATC_DB_PASS_READ,
};
const writeSqlConfig = {
	...baseSqlConfig,
	user: process.env.SIATC_DB_USER_WRITE,
	password: process.env.SIATC_DB_PASS_WRITE,
};

let readPoolPromise: Promise<sql.ConnectionPool> | null = null;
let writePoolPromise: Promise<sql.ConnectionPool> | null = null;

/** Solo lectura — usa siatc_reader (privilegio mínimo). */
export async function getReadPool(): Promise<sql.ConnectionPool> {
	if (!readPoolPromise) {
		readPoolPromise = new sql.ConnectionPool(readSqlConfig).connect().catch((err: unknown) => {
			console.error('[SIATC] Conexión a BD (read pool) falló:', err);
			readPoolPromise = null;
			throw err;
		});
	}
	return readPoolPromise;
}

/** Lectura + escritura en dbo/EBM — usa siatc_writer. */
export async function getWritePool(): Promise<sql.ConnectionPool> {
	if (!writePoolPromise) {
		writePoolPromise = new sql.ConnectionPool(writeSqlConfig).connect().catch((err: unknown) => {
			console.error('[SIATC] Conexión a BD (write pool) falló:', err);
			writePoolPromise = null;
			throw err;
		});
	}
	return writePoolPromise;
}

export { sql };
