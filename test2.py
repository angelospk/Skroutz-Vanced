import requests

cookies = {
    '__cf_bm': 'QG7YRyOkLZ93bH.DIQAFqz6TXGArH.yulb4VuZjNXoY-1671900102-0-AV+giU7O/CpqgdgN5RbEdMhSwmfI20StKK+A1DRT1q0K/7Cs5Dw6s6VrO09/wgnafEL1KgdX2ehERjN/cauZ13E=',
    '__zlcmid': '1DalTTPNLicP3Af',
    '_helmet_couch': '5zK96OUPL4%2FJurblTJIFwlygevFUphRblIf9S5dz41lCH%2BDAXA5z7r%2B4X%2BVEQH26Ul4H8RRfBjuxOmE9bE931vCpiALFI0RB4masfHjlc0zb5QGwLmxVdXBseJUUG6a9BGrS%2B211lubdVaMiZ0UInKybF8oMEB4%2FK2jS3gerETH%2Bh8NiOQtBS7MwXhlayJejHZz2cSnS%2Fkl23ZyUMwtv%2BDOGIdAM3KfE%2FyJFNPi%2F2F%2Bh8ZBrXhqRqQpkYOurTcspndViSvWCErfOCe535v4qi8fI9X58EkFO1GSNAVNVn3ui3fBuK33cYE8BKhxXjs4lZJMnSt%2Fk8HGT1A%2FZs23q2FpOVkaREpfYSoasuUptNg9E4bV8TMiXdd2MAEiDfVlaj6wyhc5xFwebW2MnMtMx7Fsk1ma%2FVzKCeP1TDBHuhQdtk7V172fvo1646fRPXQCwaPopHttiW92IQpY1TaGQj7SpYLxrOKyp8VxyzSvEoRglEKRxNczv6X14rWDMdhLUKa9n%2BXD%2FQPe6rSyyEOrVyXFva5l8beOWsSIQhA7AQ9xWrK%2Bv5BjhsclemWq4w5BUE%2F82wcU9SgXgZvlYoUhBPDZDtx%2FDLsOu1s33I4ZjqSjVwXlnYZd86NMihxSU6dwFlV0dFAHzKszq8XoLVONC5d6kX4et8N6PSFloSAx46iBoClr46gkpW2H4YSgChodLIch0xkHlnhg4yuREhWgKpfKxSK7Q7QNBsvVxUTe2GeEnEmKR%2FBtRbckWrzJ0zZrDOe77KDU6GPHRh1sbbgKvsNTTvRoeODkOtnTm%2FTN9AGmbGAygNSvsL8bv3PegVjBek%2BwCciQSYsyfXSOGs999YPyK8cCKXvvOHXX1OHi4STNTRUlC7ZcrJdqoDjepJARXpyBeAbvlVlp%2FfsJx7DwBGM53Odc2eQCOr8OQASVXBNXn3KU1FtcZcWxNicMJemKpM13%2BbcPsmPuxatBYeANCWntG0%2FamqmkYu0FrP8mChN8rgP8XoonXVQ1W%2BRhDthOC%2Bd8O1YJAphTGApHcvTt1dk%2FbSs3xAcL9miZtotBPJOX%2F--PHN26tPaLtWEufZ%2B--aYKqB4ZTXAn5PVjDcZId4g%3D%3D',
}

headers = {
    'authority': 'www.skroutz.gr',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.7',
    # 'cookie': '__cf_bm=QG7YRyOkLZ93bH.DIQAFqz6TXGArH.yulb4VuZjNXoY-1671900102-0-AV+giU7O/CpqgdgN5RbEdMhSwmfI20StKK+A1DRT1q0K/7Cs5Dw6s6VrO09/wgnafEL1KgdX2ehERjN/cauZ13E=; __zlcmid=1DalTTPNLicP3Af; _helmet_couch=5zK96OUPL4%2FJurblTJIFwlygevFUphRblIf9S5dz41lCH%2BDAXA5z7r%2B4X%2BVEQH26Ul4H8RRfBjuxOmE9bE931vCpiALFI0RB4masfHjlc0zb5QGwLmxVdXBseJUUG6a9BGrS%2B211lubdVaMiZ0UInKybF8oMEB4%2FK2jS3gerETH%2Bh8NiOQtBS7MwXhlayJejHZz2cSnS%2Fkl23ZyUMwtv%2BDOGIdAM3KfE%2FyJFNPi%2F2F%2Bh8ZBrXhqRqQpkYOurTcspndViSvWCErfOCe535v4qi8fI9X58EkFO1GSNAVNVn3ui3fBuK33cYE8BKhxXjs4lZJMnSt%2Fk8HGT1A%2FZs23q2FpOVkaREpfYSoasuUptNg9E4bV8TMiXdd2MAEiDfVlaj6wyhc5xFwebW2MnMtMx7Fsk1ma%2FVzKCeP1TDBHuhQdtk7V172fvo1646fRPXQCwaPopHttiW92IQpY1TaGQj7SpYLxrOKyp8VxyzSvEoRglEKRxNczv6X14rWDMdhLUKa9n%2BXD%2FQPe6rSyyEOrVyXFva5l8beOWsSIQhA7AQ9xWrK%2Bv5BjhsclemWq4w5BUE%2F82wcU9SgXgZvlYoUhBPDZDtx%2FDLsOu1s33I4ZjqSjVwXlnYZd86NMihxSU6dwFlV0dFAHzKszq8XoLVONC5d6kX4et8N6PSFloSAx46iBoClr46gkpW2H4YSgChodLIch0xkHlnhg4yuREhWgKpfKxSK7Q7QNBsvVxUTe2GeEnEmKR%2FBtRbckWrzJ0zZrDOe77KDU6GPHRh1sbbgKvsNTTvRoeODkOtnTm%2FTN9AGmbGAygNSvsL8bv3PegVjBek%2BwCciQSYsyfXSOGs999YPyK8cCKXvvOHXX1OHi4STNTRUlC7ZcrJdqoDjepJARXpyBeAbvlVlp%2FfsJx7DwBGM53Odc2eQCOr8OQASVXBNXn3KU1FtcZcWxNicMJemKpM13%2BbcPsmPuxatBYeANCWntG0%2FamqmkYu0FrP8mChN8rgP8XoonXVQ1W%2BRhDthOC%2Bd8O1YJAphTGApHcvTt1dk%2FbSs3xAcL9miZtotBPJOX%2F--PHN26tPaLtWEufZ%2B--aYKqB4ZTXAn5PVjDcZId4g%3D%3D',
    'dnt': '1',
    'referer': 'https://www.skroutz.gr/c/12/television/m/30/LG/f/236412_453890_1430042/Smart-TV-LED-2022.json?keyphrase=32LQ630B6LA+32%27%27+HD+READY+WIFI%5Cu0026o%3DTV+32LQ630B6LA+32%27%27+HD+READY+SMART+WIFI&o=32LQ630B6LA+32%27%27+HD+READY+WIFI%5Cu0026o%3DTV+LG+32LQ630B6LA+32%27%27+LED+HD+READY+SMART+WIFI+2022',
    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Brave";v="108"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Linux"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'sec-gpc': '1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
}

params = {
    'keyphrase': "32LQ630B6LA 32'' HD READY WIFI\\u0026o=TV 32LQ630B6LA 32'' HD READY SMART WIFI",
    'o': "32LQ630B6LA 32'' HD READY WIFI\\u0026o=TV LG 32LQ630B6LA 32'' LED HD READY SMART WIFI 2022",
}

response = requests.get(
    'https://www.skroutz.gr/c/12/television/m/30/LG/f/236412_453890_1430042/Smart-TV-LED-2022.json',
    params=params,
    cookies=cookies,
    headers=headers,
)
d=response.json()
print(d)