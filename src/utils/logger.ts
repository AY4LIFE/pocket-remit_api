import {createLogger, format, transports} from 'winston'
const {combine, timestamp, label, printf} = format

const myFormat = printf(({level, message, label, timestamp, ...metadata}) => {
    
    const metastring = Object.keys(metadata).length
    ? `${JSON.stringify(metadata)}`
    : ''
    return `${timestamp} [${label}] [${level}] ${message} ${metastring}`;
})

const devLogger = () => {
    return createLogger({
        level: 'debug',
        format: combine(
            format.colorize(),
            label({label: 'dev'}),
            timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
            myFormat
        ),
        transports: [
            new transports.Console()
        ]
    })
}

export default devLogger