const CONFIGS = [
    {
        id: 'brother',
        name: 'Brother PT P300BT',
        font: 'Source Sans Pro Bold',
        width: 0,
        height: 64,
        photo: 'printer-brother-ptouch.jpg',
        // PNG will be POSTed direclty in request body
        url: '/image/brother',
    },
    {
        id: 'esim',
        name: 'Intermec PF8d',
        font: 'Source Sans Pro Bold',
        width: 780,
        height: 1210,
        photo: 'printer-intermec-pf8d.jpg',
        // PNG will be POSTed directly in request body
        url: 'http://label.lan:8080/',
        // url: '/image/esim',
    },
]
