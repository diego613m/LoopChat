import child_process from 'child_process';
import path from 'path';

import { v2 as compose } from 'docker-compose';

type ContainerData = {
	containerName: string;
	instanceName: string;
	containerPath: string;
	shouldBuild?: boolean;
	readinessCommand?: readonly string[];
	readinessTimeoutMs?: number;
};

const containerData = {
	SAML: {
		containerName: 'saml',
		instanceName: 'testsamlidp_idp',
		containerPath: path.join(__dirname, 'saml'),
		shouldBuild: true,
	},
	LDAP: {
		containerName: 'ldap',
		instanceName: 'test_openldap',
		containerPath: path.join(__dirname, 'ldap'),
		shouldBuild: false,
		readinessCommand: [
			'ldapsearch',
			'-x',
			'-H',
			'ldap://127.0.0.1:1389',
			'-D',
			'cn=admin,dc=space,dc=air',
			'-w',
			'adminpassword',
			'-b',
			'ou=users,dc=space,dc=air',
			'(uid=alan.bean)',
			'uid',
		],
	},
} as const;

export function provideContainer({
	instanceName,
	containerName,
	containerPath,
	shouldBuild = true,
	readinessCommand,
	readinessTimeoutMs = 30_000,
}: ContainerData) {
	const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	const getContainerId = (): string | undefined => {
		try {
			return child_process
				.execFileSync('docker', ['compose', 'ps', '-q', instanceName], {
					cwd: containerPath,
					encoding: 'utf8',
				})
				.trim();
		} catch {
			return undefined;
		}
	};

	const waitUntilReady = async (): Promise<void> => {
		if (!readinessCommand) {
			return;
		}

		const waitForNextAttempt = async (): Promise<void> => {
			const containerId = getContainerId();
			if (containerId) {
				try {
					child_process.execFileSync('docker', ['exec', containerId, ...readinessCommand], {
						cwd: containerPath,
						stdio: 'ignore',
					});
					return;
				} catch {
					// ignore and retry until timeout
				}
			}

			if (Date.now() >= start + readinessTimeoutMs) {
				throw new Error(`container ${instanceName} did not become ready`);
			}

			await wait(1000);
			return waitForNextAttempt();
		};

		const start = Date.now();
		return waitForNextAttempt();
	};

	const container = {
		build: async () => {
			if (!shouldBuild) {
				return;
			}

			await compose.buildOne(instanceName, {
				cwd: containerPath,
			});
		},
		up: async () => {
			await compose.upOne(instanceName, {
				cwd: containerPath,
			});
		},

		down: async () => {
			await compose.down({
				cwd: containerPath,
			});
		},

		remove: () => {
			// the compose CLI doesn't have any way to remove images, so try to remove it with a direct call to the docker cli, but ignore errors if it fails.
			try {
				const fullName = `${containerName}-${instanceName}`;
				child_process.spawn('docker', ['rmi', fullName], {
					cwd: containerPath,
				});
			} catch {
				// ignore errors here
			}
		},

		startUp: async () => {
			await container.build();
			await container.up();
			await waitUntilReady();
		},

		cleanUp: async () => {
			await container.down();
			container.remove();
		},
	} as const;

	return container;
}

export function provideContainerFor(key: keyof typeof containerData) {
	const data = containerData[key];
	if (!data) {
		throw new Error('invalid-container-key');
	}

	return provideContainer(data);
}
