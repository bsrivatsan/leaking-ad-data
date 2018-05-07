import csv, json
import pandas as pd
import re, urlparse, requests
from base64 import urlsafe_b64encode
import boto3
from boto3.dynamodb.conditions import Key
import traceback
import time

MALICIOUS_IAB_CODES = ['IAB26-WS2', 'IAB26-3']
SENSITIVE_IAB_CODES = ['IAB26', 'IAB25-2', 'IAB25-3', 'IAB25-4', 'IAB25-5', 'IAB23', 'IAB19-WS1', 'IAB19-WS2', 'IAB14', 'IAB9-WS1', 'IAB9-WS2', 'IAB9-9', 'IAB8-5', 'IAB8-18', 'IAB7', 'IAB6-7']
MALICIOUS_WS_TOPICS = ['deceptive', 'malicious', 'parked']
SENSITIVE_WS_TOPICS = ['abortion', 'adult', 'alcoholandtobacco', 'drugs', 'gambling', 'hacking', 'illegalcontent', 'proxyandfilteravoidance', 'religion', 'weapons']

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('AdUrls')

user_info = []
user_counts = []
script_domains = {}
domain_info = {}
failed_domains = []

######################
# Data Operations
######################

def saveDomains():
    print 'Saving Domains'
    domain_df = pd.DataFrame(domain_info)
    domain_df = domain_df.transpose()
    domain_df.to_csv('domain_info.csv')

    # with open('failed_domains.csv', 'wb') as output_file:
    #     dict_writer.writerows(failed_domains)


def saveData():
    keys = sorted(user_info[0].keys())
    with open('user_ad_info.csv', 'wb') as output_file:
        dict_writer = csv.DictWriter(output_file, keys)
        dict_writer.writeheader()
        dict_writer.writerows(user_info)

    keys = sorted(user_counts[0].keys())
    with open('user_ad_counts.csv', 'wb') as output_file:
        dict_writer = csv.DictWriter(output_file, keys)
        dict_writer.writeheader()
        dict_writer.writerows(user_counts)

    script_df = pd.DataFrame(script_domains, index=[0])
    script_df = script_df.transpose()
    script_df.to_csv('script_counts.csv')


######################
# URL Checking Methods
######################

def addNewURLs(set1, set2):
    http = False
    if set2 == None:
        return http, set1
    for url in set2:
        if ('http:' in url):
            http = True
        set1.add(url)
    return http, set1

def checkRedirects(url):
    finalDoms = set()
    finalDoms.add(url)
    domains = re.findall(r'http[s]?:\/\/www\.[^%]*\.(?:com|edu|gov|org|net|uk|ca|de|jp|fr|au|us|ru|ch|nl|it|se|no|es|ads|adult|mil|co|io)', url)
    for dom in domains:
        if (re.search(r'(goog|tpc|gstatic|doubleclick|facebook|fb)', dom)):
            continue
        else:
            finalDoms.add(dom)
    return finalDoms

def hitURL(url):
    r = requests.get(url)
    finalURL = r.url
    if (finalURL != None):
        doms = set()
        doms.add(finalURL)
        return doms
    return None

def checkURL(url, check=True):
    domains = re.findall(r'\&adurl=.*', url)
    for dom in domains:
        dom = dom.replace('&adurl=','')
        if (re.search(r'(goog|tpc|gstatic|doubleclick|facebook|fb)', dom)):
            continue
        else:
            return checkRedirects(dom)
    domains = re.findall(r'http[s]?:\/\/www\.[^%]*\.(?:com|edu|gov|org|net|uk|ca|de|jp|fr|au|us|ru|ch|nl|it|se|no|es|ads|adult|mil|co|io)', url)
    for dom in domains:
        if (re.search(r'(goog|tpc|gstatic|doubleclick|facebook|fb)', dom)):
            continue
        else:
            doms = set()
            doms.add(dom)
            return doms
    domains = re.findall(r'http[s]?%3A%2F%2Fwww\.[^%]*\.(?:com|edu|gov|org|net|uk|ca|de|jp|fr|au|us|ru|ch|nl|it|se|no|es|ads|adult|mil|co|io)', url)
    for dom in domains:
        dom = dom.replace('%3A%2F%2F','://', 1)
        if (re.search(r'(goog|tpc|gstatic|doubleclick|facebook|fb)', dom)):
            continue
        else:
            doms = set()
            doms.add(dom)
            return doms
    domains = re.findall(r'http[s]?%3A%2F%2F[^%]*\.(?:com|edu|gov|org|net|uk|ca|de|jp|fr|au|us|ru|ch|nl|it|se|no|es|ads|adult|mil|co|io)', url)
    for dom in domains:
        dom = dom.replace('%3A%2F%2F','://', 1)
        if (re.search(r'(goog|tpc|gstatic|doubleclick|facebook|fb)', dom)):
            continue
        else:
            doms = set()
            doms.add(dom)
            return doms
    domains = re.findall(r'[^/]www\.[^%]*\.(?:com|edu|gov|org|net|uk|ca|de|jp|fr|au|us|ru|ch|nl|it|se|no|es|ads|adult|mil|co|io)', url)
    for dom in domains:
        dom = 'https://' + dom
        if (re.search(r'(goog|tpc|gstatic|doubleclick|facebook|fb)', dom)):
            continue
        else:
            doms = set()
            doms.add(dom)
            return doms
    domains = re.findall(r'%.[^%]*\.(?:com|edu|gov|org|net|uk|ca|de|jp|fr|au|us|ru|ch|nl|it|se|no|es|ads|adult|mil|co|io)', url)
    for dom in domains:
        dom = dom[2:]
        if(dom.find('//') == 0):
            dom = 'http://' + dom
        if (re.search(r'(goog|tpc|gstatic|doubleclick|facebook|fb)', dom)):
            continue
        else:
            doms = set()
            doms.add(dom)
            return doms
    if(check):
        if((url.find('http') != 0) or (url.find('www') != 0)):
            return None
        try:
            return hitURL(url)
        except:
            return None
    return None


######################
# URL Iteration Methods
######################

def parseList(list, check=True):
    domains = set()
    http = 0
    for key in list:
        if key == '':
            continue
        curr_doms = checkURL(key, check)
        curr_http, domains = addNewURLs(domains, curr_doms)
        if (curr_http):
            http += 1
    return http, domains

def parseMap(mapping, check=True):
    domains = set()
    http = 0
    for key, val in mapping.iteritems():
        if val == '':
            continue
        curr_doms = checkURL(val, check)
        if (curr_doms != None):
            curr_http, domains = addNewURLs(domains, curr_doms)
            if (curr_http):
                http += 1
    return http, domains

def parseGoog(data, check=True):
    http = 0
    finalDoms = set()
    urls = []
    urls.append(data['source'])
    urls.append(data['frameURL'])
    urls.append(data['parentDomain'])
    new_http, newDoms = parseList(urls)
    http += new_http
    disc, finalDoms = addNewURLs(finalDoms, newDoms)

    new_http2, newDoms = parseMap(data['adURLs'])
    http += new_http2
    disc, finalDoms = addNewURLs(finalDoms, newDoms)
    new_http3, newDoms = parseMap(data['nestedFrameURLs'])
    http += new_http3
    disc, finalDoms = addNewURLs(finalDoms, newDoms)

    return http, finalDoms

def parseScripts(scripts, check=False):
    disc, doms = parseMap(scripts, check)
    for url in doms:
        domain = urlparse.urlparse(url)[1]
        if domain in script_domains:
            script_domains[domain] += 1
        else:
            script_domains[domain] = 1


######################
# Topic Checking Code
######################

def checkMalicious(iab_codes, ws_topics=[]):
    for topic in iab_codes:
        if topic in MALICIOUS_IAB_CODES:
            return 1
        code_split = topic.split('-')
        if len(code_split) > 1 and code_split[0] in MALICIOUS_IAB_CODES:
            return 1
    for topic in ws_topics:
        if topic in MALICIOUS_WS_TOPICS:
            return 1
    return 0

def checkSensitive(iab_codes, ws_topics=[]):
    for topic in iab_codes:
        if topic in SENSITIVE_IAB_CODES:
            return 1
        code_split = topic.split('-')
        if len(code_split) > 1 and code_split[0] in SENSITIVE_IAB_CODES:
            return 1
    for topic in ws_topics:
        if topic in SENSITIVE_WS_TOPICS:
            return 1
    return 0

def findIABTopics(domain, retry=False):
    if domain == '':
        return [], []
    key = "KEY"
    secret_key = "SECRET"

    api_url = "https://api.webshrinker.com/categories/v3/%s" % urlsafe_b64encode(domain).decode('utf-8')

    response = requests.get(api_url, auth=(key, secret_key))
    status_code = response.status_code
    data = response.json()

    if status_code == 200:
        if len(data['data']) == 0:
            print "Failure on ", domain 
            print data['data']
        full_cats = data['data'][0]['categories']
        categories = []
        codes = []
        for cat in full_cats:
            if(cat['score'] > 0.3):
                categories.append(cat['label'])
                codes.append(cat['id'])
        return categories, codes
    elif status_code == 400:
        # Bad or malformed HTTP request
        print("Bad or malformed HTTP request")
    elif status_code == 401:
        # Unauthorized
        print("Unauthorized - check your access and secret key permissions")
    elif status_code == 402:
        # Request limit reached
        print("Account request limit reached")
    else:
        # General error occurred
        print("A general error occurred, try the request again")
        if not retry:
            print("Retrying ", domain)
            time.sleep(3)
            findIABTopics(domain, True)
        else:
            print("Retry Failed")
            failed_domains.append(domain)

    return [], []


def findWSTopics(domain):
    key = "KEY"
    secret_key = "SECRET"

    api_url = "https://api.webshrinker.com/categories/v3/%s" % urlsafe_b64encode(domain).decode('utf-8')

    response = requests.get(api_url, auth=(key, secret_key), params={'taxonomy':'webshrinker'})
    status_code = response.status_code
    data = response.json()

    if status_code == 200:
        full_cats = data['data'][0]['categories']
        categories = []
        for cat in full_cats:
            categories.append(cat['id'])
        return categories
    elif status_code == 400:
        # Bad or malformed HTTP request
        print("Bad or malformed HTTP request")
    elif status_code == 401:
        # Unauthorized
        print("Unauthorized - check your access and secret key permissions")
    elif status_code == 402:
        # Request limit reached
        print("Account request limit reached")
    else:
        # General error occurred
        print("A general error occurred, try the request again")
    return []

def setTopics(domains, ad_type, uid):
    iab_topics = {}
    iab_codes = {}
    #ws_topics = {}

    for dom in domains:
        if dom in domain_info:
            curr_iab_topics = domain_info[dom]['iab_topics']
            curr_iab_codes = domain_info[dom]['iab_codes']
            #curr_ws_topics = domain_info[dom]['ws_topics']
            if uid not in domain_info[dom]['uids']:
                uids = domain_info[dom]['uids']
                # uids.append(uid)
                # domain_info[dom]['uids'] = uids
        else:
            curr_iab_topics, curr_iab_codes = findIABTopics(dom)
            #curr_ws_topics = findWSTopics(dom)

            domain_info_item = {}
            domain_info_item['iab_topics'] = curr_iab_topics
            domain_info_item['iab_codes'] = curr_iab_codes
            #domain_info_item['ws_topics'] = curr_ws_topics
            uids = []
            # uids.append(uid)
            domain_info_item['uids'] = uids
            domain_info_item['count_fb'] = 0
            domain_info_item['count_goog'] = 0
            domain_info[dom] = domain_info_item

        if ad_type == 'FB':
            domain_info[dom]['count_fb'] += 1
        else:
            domain_info[dom]['count_goog'] += 1

        for topic in curr_iab_topics:
            if topic in iab_topics:
                iab_topics[topic] += 1
            else:
                iab_topics[topic] = 1
        for topic in curr_iab_codes:
            if topic in iab_codes:
                iab_codes[topic] += 1
            else:
                iab_codes[topic] = 1

    return iab_topics, iab_codes



######################
# Processing Methods
######################

def updateCounts(map1, set2):
    for k in set2:
        if k in map1:
            map1[k] += 1
        else:
            map1[k] = 1
    return map1


def updateRow(user_info_row, user_count_row, ad_type, domains, iab_topics, iab_codes, http):
    if ad_type == 'FB':
        user_count_row['count_fb'] += 1
        user_count_row['fb_http'] += http
        user_count_row['fb_mal'] += checkMalicious(iab_codes)
        user_count_row['fb_sen'] += checkSensitive(iab_codes)

        user_info_row['domains_fb'] = updateCounts(user_info_row['domains_fb'], domains)
        user_info_row['topics_iab_fb'] = updateCounts(user_info_row['topics_iab_fb'], iab_topics)
        user_info_row['codes_iab_fb'] = updateCounts(user_info_row['codes_iab_fb'], iab_codes)
        #user_info_row['topics_ws_fb'] = updateCounts(user_info_row['topics_ws_fb'], ws_topics)

    else:
        user_count_row['count_goog'] += 1
        user_count_row['goog_http'] += http
        user_count_row['goog_mal'] += checkMalicious(iab_codes)
        user_count_row['goog_sen'] += checkSensitive(iab_codes)

        user_info_row['domains_goog'] = updateCounts(user_info_row['domains_goog'], domains)
        user_info_row['topics_iab_goog'] = updateCounts(user_info_row['topics_iab_goog'], iab_topics)
        user_info_row['codes_iab_goog'] = updateCounts(user_info_row['codes_iab_goog'], iab_codes)
        #user_info_row['topics_ws_goog'] = updateCounts(user_info_row['topics_ws_goog'], ws_topics)

    return user_info_row, user_count_row
    

def processResponse(response, info_row, count_row, uid):
    for item in response:
        try:
            if type(item) != dict:
                continue
            if 'data' not in item:
                continue
            data = item['data']
            ad_type = data['type']

            if (ad_type == 'FB'):
                http, doms = parseList(data['urls'])
            else:
                http, doms = parseGoog(data)
                parseScripts(data['scriptURLs'])
            
            finalDoms = set()
            for url in doms:
                finalDoms.add(urlparse.urlparse(url)[1])
            
            iab_topics, iab_codes = setTopics(finalDoms, ad_type, uid)
            info_row, count_row = updateRow(info_row, count_row, ad_type, finalDoms, iab_topics, iab_codes, http)
        except Exception as e:
            traceback.print_exc()
            print e
            saveDomains()
            continue

    return info_row, count_row


def initializeRow(uid):
    user_info_row = {}
    user_info_row['0uid'] = uid
    user_info_row['domains_fb'] = {}
    user_info_row['domains_goog'] = {}
    user_info_row['topics_iab_fb'] = {}
    user_info_row['topics_iab_goog'] = {}
    user_info_row['codes_iab_fb'] = {}
    user_info_row['codes_iab_goog'] = {}

    user_count_row = {}
    user_count_row['0uid'] = uid
    user_count_row['count_fb'] = 0
    user_count_row['count_goog'] = 0
    user_count_row['fb_http'] = 0
    user_count_row['fb_mal'] = 0
    user_count_row['fb_sen'] = 0
    user_count_row['goog_http'] = 0
    user_count_row['goog_mal'] = 0
    user_count_row['goog_sen'] = 0

    return user_info_row, user_count_row


######################
# Main Methods
######################

domain_df = pd.read_csv('domain_info.csv', index_col=0)
domain_df = domain_df.transpose()
domain_info = domain_df.to_dict()

with open('userdata.csv') as f:
    reader = csv.reader(f)
    for row in reader:
        try:
            uid = row[0]
            user_info_row, user_count_row = initializeRow(uid)
            print uid

            response = table.query(
                IndexName='uid-index',
                KeyConditionExpression=Key('uid').eq(uid)
            )
            user_info_row, user_count_row = processResponse(response['Items'], user_info_row, user_count_row, uid)

            while 'LastEvaluatedKey' in response:
                response = table.query(
                    IndexName='uid-index',
                    KeyConditionExpression=Key('uid').eq(uid),
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                user_info_row, user_count_row = processResponse(response['Items'], user_info_row, user_count_row, uid)

            user_info.append(user_info_row)
            user_counts.append(user_count_row)
            saveDomains()
        except Exception as e:
            traceback.print_exc()
            print e
            saveDomains()

saveDomains()
saveData()