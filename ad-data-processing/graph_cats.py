import networkx as nx 
import numpy as np
import csv, json, pprint
import matplotlib as mpl 
mpl.use('TkAgg')
import matplotlib.pyplot as plt
import pylab
from networkx.drawing.nx_agraph import graphviz_layout

###############################
# Program Parameters 
###############################
MIN_WEIGHT = 1
TOP_NUM = 2
NODE_SIZE = 50
FONT_SIZE = 8
# gender, race, away, travel, distance, shopper, liberal, soccer, os, genrace
SETTING = 'TRAVEL'
# fb/goog _ doms/codes
DATA_TYPE = 'fb_doms'
# true or false - to display graph
SHOW = True


###############################
# Facebook Category Descriptors
###############################

away = ['Away from family', 'Away from hometown']
travel = ['Frequent Travelers', 'Frequent international travelers', 'Close friends of expats']
dist = ['Frequent Travelers', 'Frequent international travelers', 'Close friends of expats', 'Away from family', 'Away from hometown']
libs = ['US politics (very liberal)', 'US politics (liberal)']
soccer = ['Soccer/US soccer fans (moderate content engagement)', 'Friends of Soccer/US soccer fans']
os = ['Facebook access: older devices and OS']
shop = ['Engaged Shoppers']

###############################
# Total interest counts
###############################

all_interests_google = {}
all_interests_fb = {}

iab_catmap = {}
with open('iab_cats.txt') as f1:
    iablist = [l.strip() for l in f1]
    for iab in iablist:
        vals = iab.split(' - ')
        if len(vals) < 2:
            continue
        iab_catmap[vals[0]] = vals[1]

def convertStr(str):
    new_str = str[1:-1]
    items = new_str.split(', ')
    str_dict = {}
    for item in items:
        kv = item.split(': ')
        if len(kv) < 2:
            continue
        key = kv[0].strip()
        key = key[1:-1]
        val = kv[1].strip()
        if 'IAB' not in key:
            continue
        str_dict[key] = val
    return str_dict

def convertStrDomain(str):
    new_str = str[1:-1]
    items = new_str.split(', ')
    str_dict = {}
    for item in items:
        kv = item.split(': ')
        if len(kv) < 2:
            continue
        key = kv[0].strip()
        key = key[2:-1]
        val = kv[1].strip()
        str_dict[key] = int(val)
    return str_dict


###############################
# Top item selector
###############################


def pickTop(data, goog=False, fb=False):
    new_data = {}
    i = 1
    for key, value in sorted(data.iteritems(), key=lambda (k,v): (v,k), reverse=True):
        label_trim = key[1:]
        if goog:
            if label_trim in iab_catmap:
                if iab_catmap[label_trim] in all_interests_google:
                    all_interests_google[iab_catmap[label_trim]] += 1
                else:
                    all_interests_google[iab_catmap[label_trim]] = 1
            else:
                print label_trim
        elif fb:
            if label_trim in iab_catmap:
                if iab_catmap[label_trim] in all_interests_fb:
                    all_interests_fb[iab_catmap[label_trim]] += 1
                else:
                    all_interests_fb[iab_catmap[label_trim]] = 1
            else:
                print label_trim

        if i > TOP_NUM:
            break
        new_data[key] = value
        i += 1
    return new_data

###############################
# Process User Data/Attributes
###############################

userdata = []
with open('user_ad_info.csv') as f:
    reader = csv.reader(f)
    next(reader)
    for line in reader:
        data = {}
        data['uid'] = line[0]
        data['fb_codes'] = pickTop(convertStr(line[1]), goog=True)
        data['goog_codes'] = pickTop(convertStr(line[2]), fb = True)
        data['fb_doms'] = pickTop(convertStrDomain(line[3]))
        data['goog_doms'] = pickTop(convertStrDomain(line[4]))
        userdata.append(data)

userattributes = []
with open('userdata_graphing.csv') as f2:
    reader = csv.reader(f2)
    next(reader)
    for line in reader:
        data = {}
        data['uid'] = line[0]
        data['gender'] = line[1]
        data['race'] = line[2]
        data['Away from family'] = line[3]
        data['Away from hometown'] = line[4]
        data['Close friends of expats'] = line[5]
        data['Engaged Shoppers'] = line[6]
        data['Facebook access: older devices and OS'] = line[7]
        data['Frequent Travelers'] = line[8]
        data['Frequent international travelers'] = line[9]
        data['Soccer/US soccer fans (moderate content engagement)'] = line[10]
        data['Friends of Soccer/US soccer fans'] = line[11]
        data['US politics (very liberal)'] = line[12]
        data['US politics (liberal)'] = line[13]
        userattributes.append(data)


###############################
# Connect users
###############################

adj_matrix = np.zeros(shape=(80,80))
edge_Ct = 0

for i in range (0, 80):
    data_i = userdata[i]
    info_i = data_i[DATA_TYPE]

    for j in range(0, 80):
        if j <= i:
            continue
        data_j = userdata[j]
        info_j = data_j[DATA_TYPE]

        for code, count in info_i.iteritems():
            if int(count) < MIN_WEIGHT:
                continue
            if code in info_j:
                if int(info_j[code]) < MIN_WEIGHT:
                    continue
                avg = (int(count) + int(info_j[code]))/2
                adj_matrix[i][j] += 1
                adj_matrix[j][i] += 1
                edge_Ct += 1

# for key, value in sorted(all_interests_google.iteritems(), key=lambda (k,v): (v,k), reverse=True):
#     print key, value
# print '\n\nNEXT\n\n'
# for key, value in sorted(all_interests_fb.iteritems(), key=lambda (k,v): (v,k), reverse=True):
#     print key, value


# adj_matrix /= np.max(adj_matrix) * 2
print edge_Ct
pprint.pprint(adj_matrix)

###############################
# Color graph
###############################

G = nx.from_numpy_matrix(adj_matrix)

color_map = []
label_map = {}
remove_list = []
count = 0
for i in range(0, 80):
    data = userattributes[i]
    if SETTING == 'GENDER':
        if data['gender'] == 'female':
            color_map.append('blue')
            count += 1
        elif data['gender'] == 'male':
            color_map.append('red')
            count += 1
        else:
            remove_list.append(i)
            color_map.append('green')

    elif SETTING == 'RACE':
        if data['race'] == 'WHI':
            color_map.append('blue')
            count += 1
        elif data['race'] == 'AZN':
            color_map.append('red')
            count += 1
        else:
            remove_list.append(i)
            color_map.append('green')

    elif SETTING == 'GENRACE':
        if data['race'] == 'WHI':   
            if data['gender'] == 'female':    
                color_map.append('blue')
            elif data['gender'] == 'male':    
                color_map.append('green')
            else:
                color_map.append('white')               
        elif data['race'] == 'AZN':   
            if data['gender'] == 'female':    
                color_map.append('red')
            elif data['gender'] == 'male':    
                color_map.append('purple')    
            else:
                color_map.append('white') 
        else:
            color_map.append('white') 
    else:
        cats = []
        if SETTING == 'AWAY':
            cats = away
        elif SETTING == 'TRAVEL':
            cats = travel
        elif SETTING == 'LIBERAL':
            cats = libs
        elif SETTING == 'SHOPPER':
            cats = shop
        elif SETTING == 'SOCCER':
            cats = soccer
        elif SETTING == 'DISTANCE':
            cats = dist
        else:
            cats = os
        edit = True
        for cat in cats:
            if not edit:
                break
            if data[cat] == 'True':
                color_map.append('green')
                edit = False
                count += 1
        if edit:
            color_map.append('red')
    
    if 'codes' in DATA_TYPE:
        label_iabs = userdata[i][DATA_TYPE].keys()
        label_cats = []
        for label in label_iabs:
            label_trim = label[1:]
            if label_trim in iab_catmap:
                label_cats.append(iab_catmap[label_trim])
            else:
                label_cats.append(label_trim)
        label_map[i] = str(label_cats)
    else:
        label_map[i] = str(userdata[i][DATA_TYPE].keys())

print count
# pylab.figure(1)
# pos=nx.spring_layout(G)
# nx.draw(G, pos, node_color = color_map, node_size = NODE_SIZE)

###############################
# Display graph
###############################

if SHOW:
    pylab.figure(1)
    nx.draw(G, node_color = color_map, pos=graphviz_layout(G), node_size=NODE_SIZE, prog='neato')
    pylab.figure(2)
    nx.draw(G, node_color = color_map, pos=graphviz_layout(G), labels=label_map, node_size=NODE_SIZE, font_size = FONT_SIZE, prog='neato')
    pylab.show()