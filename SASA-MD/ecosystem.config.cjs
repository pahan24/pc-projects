module.exports = {
  apps: [{
    name: 'SASA-MD',
    script: 'index.js',
    interpreter: 'node',
    interpreter_args: '--experimental-vm-modules',
    max_memory_restart: '512M',
    restart_delay: 5000,
    max_restarts: 20,
    env: { NODE_ENV: 'production' },
    error_file: './logs/pm2-error.log',
    out_file:   './logs/pm2-out.log',
    time: true,
  }]
};
