import serial

from .labelmaker_encode import encode_raster_transfer, read_png
from . import ptcbp
from . import ptstatus
import time


def reset_printer(ser):
    # Flush print buffer
    ser.write(b"\x00" * 64)

    # Initialize
    ser.write(ptcbp.serialize_control('reset'))

    # Enter raster graphics (PTCBP) mode
    ser.write(ptcbp.serialize_control('use_command_set', ptcbp.CommandSet.ptcbp))


def read_status(ser):
    # Read status
    ser.write(ptcbp.serialize_control('get_status'))
    status = ptstatus.unpack_status(ser.read(32))
    # ptstatus.print_status(status)
    return status


def configure_common(ser, compress=True, end_margin=0):
    # Set print chaining off (0x8) or on (0x0)
    ser.write(ptcbp.serialize_control('set_page_mode_advanced', 0x08))

    # Set no mirror, no auto tape cut
    # 0x0 (no auto cut) or 0x40 (ptcbp.PageMode.auto_cut)
    ser.write(ptcbp.serialize_control('set_page_mode', 0x0))

    # Set margin amount (feed amount, in dots)
    ser.write(ptcbp.serialize_control('set_page_margin', end_margin))

    # Set compression mode: TIFF
    ser.write(ptcbp.serialize_control('compression', ptcbp.CompressionType.rle
                                      if compress else
                                      ptcbp.CompressionType.none))


def configure_tape(ser, tape, raster_lines):
    typ, width, length = tape

    # Set media & quality
    ser.write(ptcbp.serialize_control_obj('set_print_parameters', ptcbp.PrintParameters(
        active_fields=(ptcbp.PrintParameterField.width |
                       ptcbp.PrintParameterField.quality |
                       ptcbp.PrintParameterField.recovery),
        media_type=typ,
        width_mm=width,  # Tape width in mm
        length_mm=length,  # Label height in mm (0 for continuous roll)
        length_px=raster_lines,  # Number of raster lines in image data
        is_follow_up=0,  # Unused
        sbz=0,  # Unused
    )))


def setup_printer(ser):
    reset_printer(ser)
    configure_common(ser)


def print_label(ser, data, compress=True):
    t0 = time.time()
    status = read_status(ser)
    if status.err != 0x0000 or status.phase_type not in (0x00, 0x01) or status.phase != 0x0000:
        ptstatus.print_status(status)
        raise Exception(f'Printer indicates that it is not ready ({status.err}, {status.phase_type}, {status.phase}). Refusing to continue.')

    raster_lines = len(data) // 16

    tape = (status.tape_type, status.tape_width, status.tape_length)
    configure_tape(ser, tape, raster_lines)

    # send data
    for line in encode_raster_transfer(data, not compress):
        ser.write(line)

    # print and feed
    ser.write(ptcbp.serialize_control('print'))

    # Dump status that the printer returns
    raw_status = ser.read(32)
    status = ptstatus.unpack_status(raw_status)
    # ptstatus.print_status(status)
    t1 = time.time()
    print('total time', t1 - t0)


def connect(port):
    ser = serial.Serial(port)
    setup_printer(ser)
    # status = read_status(ser)
    return ser


if __name__ == "__main__":
    ser = connect('/dev/rfcomm0')
    data = read_png('../label.png')
    __import__('pdb').set_trace()
    # print_label(ser, data)
