import os
import base64
import json
import asyncio
import aiohttp
from aiofiles import open as aio_open
import fal_client
import datetime

async def read_image(_path):
    if _path.startswith('http'):
        async with aiohttp.ClientSession() as session:
            async with session.get(_path) as response:
                return await response.read()
    else:
        async with aio_open(os.path.join(os.getcwd(), 'public', _path), 'rb') as f:
            return await f.read()

async def subscribe(image_url, prompt):
    # def on_queue_update(update):
    #     if isinstance(update, fal_client.InProgress):
    #         for log in update.logs:
    #             print(log["message"])

    result = await fal_client.subscribe_async(
        "fal-ai/llava-next",
        arguments={
            "image_url": image_url,
            "prompt": prompt,
        },
        # on_queue_update=on_queue_update,
    )

    print(result)


async def test(_path):
    schema = '{"foreground": {"doctor": {"EXIST": "...", "gender": "..."}, "nurse": {"EXIST": "...", "gender": "..."}}}'
    candidate_values = None

    image_data = await read_image(_path)
    image_base64 = base64.b64encode(image_data).decode('utf-8')
    image_data_uri = f"data:image/jpeg;base64,{image_base64}"

    input_data = {
        'image_url': image_data_uri,
        'top_p': 1,
        'prompt': (f"Given the image, finish the label tree based on the provided schema. "
                   f"Specifically, for each leaf node, generate a label according to the scene in the image, "
                   f"and replace the placeholder value '...' with the generated label. All labels must be strings, "
                   f"and should NOT be numbers, booleans, or arrays. "
                   f"{'You are required to choose from the following values: ' + candidate_values if candidate_values else ''} "
                   f"If a specific node is not present in the image, replace the node value with the object {{'EXIST': 'no'}}. "
                   f"Output the results in JSON. Your output should NOT include the placeholder '...'. Schema: {schema}"),
        'max_tokens': 1024,
        'temperature': 0.8
    }

    print("started: ", datetime.datetime.now().strftime("%H:%M:%S"))
    
    output = await subscribe(input_data['image_url'], input_data['prompt'])

    print("finished: ", datetime.datetime.now().strftime("%H:%M:%S"))
    print("input:", input_data['prompt'])
    print("output:", output)

    # Store the output in a file
    file_path = os.path.join(os.getcwd(), 'public', 'temp_images', f"{os.path.basename(_path).rsplit('.', 1)[0]}.json")
    async with aio_open(file_path, 'w') as f:
        await f.write(json.dumps(output, indent=2))

async def process_images(paths):
    await asyncio.gather(*(test(path) for path in paths))

# paths = [
#     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_0.png",
#     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_1.png",
#     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_2.png",
#     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_3.png",
#     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_4.png",
#     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_5.png",
#     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_6.png",
#     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_7.png",
#     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_8.png",
#     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_9.png",
# ]

paths = []
for i in range(50):
    paths.append(f"temp_images/a_cinematic_photo_of_a_doctor/A_cinematic_photo_of_a_doctor_{i}.png")

asyncio.run(process_images(paths))