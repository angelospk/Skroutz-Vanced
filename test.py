import asyncio
import aiohttp
"""

# Asynchronous function to make a request and get the "skus" list
async def fetch_skus(session, url):
  # Make the initial request
  async with session.get(url) as response:
    redirect_url = response["redirectUrl"]
    print(redirect_url)
  fixed_url = redirect_url.replace('.html', '.json')
  print(fixed_url)
  # Make a request to the fixed URL
  async with session.get(fixed_url) as fixed_response:
    # Get the "skus" list
    skus = await fixed_response.json()
    return skus['skus']

# Asynchronous function to gather tasks and return the results
async def gather_tasks(urls):
  tasks = []
  
  # Create a session
  async with aiohttp.ClientSession() as session:
    # Iterate over the URLs
    for url in urls:
      # Create a task to fetch the "skus" list
      task = asyncio.create_task(fetch_skus(session, url))
      tasks.append(task)
    
    # Gather the tasks
    results = await asyncio.gather(*tasks)
    
    return results

@app.route('/post_json', methods=['POST'])
def process_json():
  data = json.loads(request.data)
  urls = data['urls']
  
  # Run the asynchronous function to gather tasks and return the results
  skus = asyncio.run(gather_tasks(urls))
  
  return skus

url="https://www.skroutz.gr/search.json?keyphrase=TV%20LG%2032LQ630B6LA%2032%27%27%20LED%20HD%20READY%20SMART%20WIFI%202022"
response = requests.get(url)
"""
import requests





cookies = {
    '__zlcmid': '18BkeTuMrQpsywB',
    '_fbp': 'fb.1.1642937809076.828206185',
    'logged_in': 'true',
    'policy_level': '%7B%22essential%22%3A%22true%22%2C%22performance%22%3A%22true%22%2C%22preference%22%3A%22true%22%2C%22targeting%22%3A%22true%22%7D',
    '__cf_bm': 'mSSSLkEyQgWXIulU9gVcgMeOT3X.yqSgOXvYhIGKaOI-1671896202-0-ATb36/62E0DO3ZpwfDOHyy4cueSPgcEP3bYrSLcvECeXwwxSGMPAcwrjXwQvJE7QCVFC6ITJ5TfPXuyYtTl99vY=',
    '_helmet_couch': 'EdYsXDJbfBj4gq%2FMxO8rL2bVWedYDsE8LcSKROqfoQnTA40b2vbgqJCbVhx%2FJcs8e%2BPY5s48SASJ6gPpE36K0zFCa%2FdHsN0Tk6EieKCg8fwDH2wQU8JLj4PniJMaTAr9HyydgTkVrQBelyVGb19MySBq%2BK%2FQvOKt5X73Ps6mO8Sy5gWt3IRhO3ZOPFqv81TLpVAqLSJfrHohLXu5ywNFTqtAcpKZTXDUjP1MJ6mC7AH2Puc4U4tQY%2BERHMBZBkZyp2F%2FngV4A5CyMUA%2BQW7tP78QQWVfAx9V5hEZ1daygp8F327q7wRB9HCs4TWPLm7G6iaBzOuCPG%2FDLLkj3qAL9DyjpmqA2m9mFG78OaQ0ZwlCxpinfQt%2FYhu5SEvwiBx%2FOV5GN0%2FjCcfknUMrmMAehPc8B%2FKjWtWz%2FuHI1Uo8uiYvPM6nF1Fcmr0fclClPb2s2G9iQ%2BjhzUSf9fmWWplIlAWc1i6klKOGatnMBOeK0%2BmyGoS1iu%2F2tQmmzJiAr1TGom3AFRJkkr7CR12rTLrdwU6jiLtXV9EPFzt%2B32jFAeqF%2FbkBr%2FGESPSfnr7qeM9A5O38zteqoIXgepqqPf2Mq2AOYfIaPComLAakG99wVtaXA7f4%2BoMfrJLvkWtCBv%2BBx3tF5NFww5oaA%2FmbtD0F%2B9Oauk1XLOAdRF%2B%2Fvs0Hx8TaqXsvItrog%2BgmA5jPWb8boLxqiZihLQQRAtVADRMAmimssWftJFowOJov31fwKKJIulpdux0BArDEvRaBwLDNYtNE61z3T9rs4%2BTe2DTOYkniXPNcbtBF6KGtkYK7n4kr6NHihmY4FCO2dVCUI%2FNJFUxGcvnxnnJ6cBcGEMKG4O3WaKPZiUaNKPOMInXWOgHVuq2dxaKk%2B1McEpOeVwJQiDn%2BFaG7BdgBWhP9RfGNyDX%2BDQ9N3cIaNroDEbl02iXg56Ack%2BTbTOTbTegaEwK6szDOkuUYKsXDmny%2FsTlYcsy4v4GZWNE5TnGWiCQKIeidwYEPUtg4I2e8%2FWnwjP2Qlf%2Fov%2FisfhKfhSXPOnTwo2Jajk6%2FKKyZ%2BOdsLG6cLbaplu8QgJzs7XNk0WwOwczlhC5jRB%2BBuuHcymm9Mr39XW50Wi3FV5hd6hXgC9taHuJT7CdD3Y%2BvSrb9O8SiOUMN%2B9H9I2nvFuFv58%2FhelYvAkAUW2Lh%2BpMtqY3lHy1%2FVioYAfO6CrsIXToalio2ECKBccxHUNTy41DiorzS4ZEj3hnJnaosbvYWZNumyzaaxrC%2Flox8OUbBFPqTCg0OQGVUToVx8ZFM4HGpdbUN2GWgYlGAZ7kQz4TQNDHfVvTS9evUgj69nhFHe2wmNu%2FNhGuaNZO46ehDoVKCOw3UeENYWJwl2Pj0DjDgUMhHPsvEti15Vym5DzN2iRAFHdmKuGJB4Wx7IiyPORv%2FJNM%2By94kqMOzSCqM%2FdKB7MegI1WohTFysUe2kQCRYdwRdzyxrVDWD9get1nKM6yOWSqScDXNBsKlEZAJqdUnWPDJKTLUliQ6rrIU14wCYMep3i27xCxO2UVHfemnBl8Fqvm0PB%2FUfhsDbBuhS7qnEwy%2Fa3ro0QhTqRBZPxQ4Fm190e7f8Z1aTzgIhitelo0Sp%2FKhI0db%2FDAyvRo1M4uKIgtYrX0bilHFMAvSWPoLz81Uf2zu34peqUo79PQexy1L0zaovzg8kTohKUaR1BR1H%2ByYiCf782QtSgviR%2FvJ7oZdzIA7CQPHvlTS94yz1sdlgeUqcH%2Fu7e2yOiXIJ0spl4blL1O22HY1gDZdaIZuDa6V%2FpiKuCnl6Rp9ZYGeXEE2MwmaxBDkjHzgMtsa4tZsi3DRuEJ%2BJRaztHKZb%2BjKmyURyxZ4sjk0ZpxgK%2FV2Xw88Wtb1zMjv3EVdr7Hug8F%2FN%2F1hxMLD97%2B2vi1FKmKeodIRO3A5bHo%3D--zIOssdKHEv2mEqxF--yiDcM1f%2FoKphf7v%2FHw6Fzw%3D%3D',
}

headers = {
    'authority': 'www.skroutz.gr',
    'accept-language': 'en-US,en;q=0.8',
    # 'cookie': '__zlcmid=18BkeTuMrQpsywB; _fbp=fb.1.1642937809076.828206185; logged_in=true; policy_level=%7B%22essential%22%3A%22true%22%2C%22performance%22%3A%22true%22%2C%22preference%22%3A%22true%22%2C%22targeting%22%3A%22true%22%7D; __cf_bm=mSSSLkEyQgWXIulU9gVcgMeOT3X.yqSgOXvYhIGKaOI-1671896202-0-ATb36/62E0DO3ZpwfDOHyy4cueSPgcEP3bYrSLcvECeXwwxSGMPAcwrjXwQvJE7QCVFC6ITJ5TfPXuyYtTl99vY=; _helmet_couch=EdYsXDJbfBj4gq%2FMxO8rL2bVWedYDsE8LcSKROqfoQnTA40b2vbgqJCbVhx%2FJcs8e%2BPY5s48SASJ6gPpE36K0zFCa%2FdHsN0Tk6EieKCg8fwDH2wQU8JLj4PniJMaTAr9HyydgTkVrQBelyVGb19MySBq%2BK%2FQvOKt5X73Ps6mO8Sy5gWt3IRhO3ZOPFqv81TLpVAqLSJfrHohLXu5ywNFTqtAcpKZTXDUjP1MJ6mC7AH2Puc4U4tQY%2BERHMBZBkZyp2F%2FngV4A5CyMUA%2BQW7tP78QQWVfAx9V5hEZ1daygp8F327q7wRB9HCs4TWPLm7G6iaBzOuCPG%2FDLLkj3qAL9DyjpmqA2m9mFG78OaQ0ZwlCxpinfQt%2FYhu5SEvwiBx%2FOV5GN0%2FjCcfknUMrmMAehPc8B%2FKjWtWz%2FuHI1Uo8uiYvPM6nF1Fcmr0fclClPb2s2G9iQ%2BjhzUSf9fmWWplIlAWc1i6klKOGatnMBOeK0%2BmyGoS1iu%2F2tQmmzJiAr1TGom3AFRJkkr7CR12rTLrdwU6jiLtXV9EPFzt%2B32jFAeqF%2FbkBr%2FGESPSfnr7qeM9A5O38zteqoIXgepqqPf2Mq2AOYfIaPComLAakG99wVtaXA7f4%2BoMfrJLvkWtCBv%2BBx3tF5NFww5oaA%2FmbtD0F%2B9Oauk1XLOAdRF%2B%2Fvs0Hx8TaqXsvItrog%2BgmA5jPWb8boLxqiZihLQQRAtVADRMAmimssWftJFowOJov31fwKKJIulpdux0BArDEvRaBwLDNYtNE61z3T9rs4%2BTe2DTOYkniXPNcbtBF6KGtkYK7n4kr6NHihmY4FCO2dVCUI%2FNJFUxGcvnxnnJ6cBcGEMKG4O3WaKPZiUaNKPOMInXWOgHVuq2dxaKk%2B1McEpOeVwJQiDn%2BFaG7BdgBWhP9RfGNyDX%2BDQ9N3cIaNroDEbl02iXg56Ack%2BTbTOTbTegaEwK6szDOkuUYKsXDmny%2FsTlYcsy4v4GZWNE5TnGWiCQKIeidwYEPUtg4I2e8%2FWnwjP2Qlf%2Fov%2FisfhKfhSXPOnTwo2Jajk6%2FKKyZ%2BOdsLG6cLbaplu8QgJzs7XNk0WwOwczlhC5jRB%2BBuuHcymm9Mr39XW50Wi3FV5hd6hXgC9taHuJT7CdD3Y%2BvSrb9O8SiOUMN%2B9H9I2nvFuFv58%2FhelYvAkAUW2Lh%2BpMtqY3lHy1%2FVioYAfO6CrsIXToalio2ECKBccxHUNTy41DiorzS4ZEj3hnJnaosbvYWZNumyzaaxrC%2Flox8OUbBFPqTCg0OQGVUToVx8ZFM4HGpdbUN2GWgYlGAZ7kQz4TQNDHfVvTS9evUgj69nhFHe2wmNu%2FNhGuaNZO46ehDoVKCOw3UeENYWJwl2Pj0DjDgUMhHPsvEti15Vym5DzN2iRAFHdmKuGJB4Wx7IiyPORv%2FJNM%2By94kqMOzSCqM%2FdKB7MegI1WohTFysUe2kQCRYdwRdzyxrVDWD9get1nKM6yOWSqScDXNBsKlEZAJqdUnWPDJKTLUliQ6rrIU14wCYMep3i27xCxO2UVHfemnBl8Fqvm0PB%2FUfhsDbBuhS7qnEwy%2Fa3ro0QhTqRBZPxQ4Fm190e7f8Z1aTzgIhitelo0Sp%2FKhI0db%2FDAyvRo1M4uKIgtYrX0bilHFMAvSWPoLz81Uf2zu34peqUo79PQexy1L0zaovzg8kTohKUaR1BR1H%2ByYiCf782QtSgviR%2FvJ7oZdzIA7CQPHvlTS94yz1sdlgeUqcH%2Fu7e2yOiXIJ0spl4blL1O22HY1gDZdaIZuDa6V%2FpiKuCnl6Rp9ZYGeXEE2MwmaxBDkjHzgMtsa4tZsi3DRuEJ%2BJRaztHKZb%2BjKmyURyxZ4sjk0ZpxgK%2FV2Xw88Wtb1zMjv3EVdr7Hug8F%2FN%2F1hxMLD97%2B2vi1FKmKeodIRO3A5bHo%3D--zIOssdKHEv2mEqxF--yiDcM1f%2FoKphf7v%2FHw6Fzw%3D%3D',
    'dnt': '1',
    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Brave";v="108"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Linux"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'sec-gpc': '1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
}

params = {
    'keyphrase': "TV LG 32LQ630B6LA 32'' LED HD READY SMART WIFI 2022",
}

response = requests.get('https://www.skroutz.gr/search.json', params=params, cookies=cookies, headers=headers)

print(response)