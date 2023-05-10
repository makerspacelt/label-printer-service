// NOTE:
// * id is used to get status from the backend
// * name must be unique
const CONFIGS = [
    {
        id: 'brother',
        name: 'Brother PT P300BT',
        font: 'Source Sans Pro Bold',
        width: 0,
        height: 64,
        rotatable: false,
        photo: 'printer-brother-ptouch.jpg',
        // PNG will be POSTed direclty in request body
        url: '/image/brother',
    },
    {
        id: 'esim',
        name: 'Intermec PF8d (big)',
        font: 'Source Sans Pro Bold',
        width: 780,
        height: 1210,
        rotatable: true,
        photo: 'printer-intermec-pf8d.jpg',
        // PNG will be POSTed directly in request body
        url: 'http://label.lan:8080/',
    },
    {
        id: 'esim',
        name: 'Intermec PF8d (small)',
        font: 'Source Sans Pro Bold',
        width: 320,
        height: 416,
        rotatable: true,
        photo: 'printer-intermec-pf8d.jpg',
        // PNG will be POSTed directly in request body
        url: 'http://label.lan:8080/',
    },
]
