from aiohttp import web
from threading import Thread
from brother_ptouch import serialcomm
from time import sleep
from traceback import format_exc
import esim
import io
import queue
import os


brother_dev = '/dev/rfcomm0'
esim_dev = '/dev/usb/lp0'

queue_brother = queue.Queue()
queue_esim = queue.Queue()


def run_brother_thread():
    retry_delay = 5
    serial = None
    while True:
        try:
            serial = serialcomm.connect(brother_dev)
            print(f'run_brother_thread(): Opened serial connection to {brother_dev}')
            while True:
                png_image_data = None
                try:
                    png_image_data = queue_brother.get(timeout=1)
                except queue.Empty:
                    pass
                serial.flush()
                if png_image_data:
                    print('run_brother_thread(): printing')
                    label_img_data = serialcomm.read_png(io.BytesIO(png_image_data))
                    serialcomm.print_label(serial, label_img_data)
                    queue_brother.task_done()
        except Exception as e:
            print(f'run_brother_thread(): Error with {brother_dev} (retry in {retry_delay}s): {str(e)}')
            if serial:
                try:
                    serial.close()
                except Exception as e:
                    print('run_brother_thread() exception in serial.close():', format_exc())
            sleep(retry_delay)


def run_esim_thread():
    while True:
        try:
            png_image_data = queue_esim.get()
            print('run_esim_thread(): printing')
            ep = esim.EsimPrint()
            ep.set_copies(1)
            print('preparing bytes')
            esim_data = ep.print_bytes(png_image_data)
            print('data:', esim_data)  # XXX
            continue

            with open(esim_dev, 'w') as f:
                f.write(esim_data)
        except Exception:
            print('run_esim_thread() exception: ', format_exc())


thread_brother = Thread(target=run_brother_thread, daemon=True)
thread_esim = Thread(target=run_esim_thread, daemon=True)

thread_brother.start()
thread_esim.start()

routes = web.RouteTableDef()


@routes.get("/")
async def get_index(request):
    raise web.HTTPFound(location='/index.html')


@routes.get("/status")
async def get_status(request):
    return web.json_response({
        'brother': {
            'task_count': queue_brother.qsize(),
            'ok': os.path.exists(brother_dev),
        },
        'esim': {
            'task_count': queue_esim.qsize(),
            'ok': os.path.exists(esim_dev),
        },
    })


@routes.post('/image/brother')
async def post_image_brother(request):
    """Expecting raw PNG image data in POST request body."""
    # Read incoming img to memory.
    png_image_data = await request.content.read()
    if png_image_data:
        queue_brother.put(png_image_data)
        return web.Response(text='Ok')
    else:
        return web.Response(status=400, text='No data received.')


@routes.post('/image/esim')
async def post_image_esim(request):
    """Expecting raw PNG image data in POST request body."""
    # Read incoming img to memory.
    png_image_data = await request.content.read()
    if png_image_data:
        queue_esim.put(png_image_data)
        return web.Response(text='Ok')
    else:
        return web.Response(status=400, text='No data received.')

routes.static('/', '../frontend')

app = web.Application()
app.add_routes(routes)
web.run_app(app, port=80)
