#!/usr/local/bin/python

import csv


# below for incorporating on, ha data

#f = csv.reader(open('../../Desktop/fema-summed.csv'))
#z = csv.reader(open('../../Desktop/zip-master.csv'))
#
#fema = [l for l in f]
#zips = [l for l in z]
#
#for line in zips:
#    if line[3] == 'TRUE': # if town is a parent
#        fema.append([line[0], line[1], line[3],'' ,'' ,'' , line[2]])
#        line[0] = 'x'
#    else:
#        for town in fema:
#            if line[0] == town[0]:
#                town[1] = line[1]
#                line[0] = 'x'
#                if line[3]:
#                    town[2] = line[3]
#
#    if line[0] != 'x':
#        fema.append([ line[0], line[1] ])
#
#writer = csv.writer(open('../../Desktop/new.csv', 'w'))
#writer.writerows(fema)


#below for combining towns in pa data

#f = csv.reader(open('../../Desktop/public-assistance.csv'))
#
#pa = [l for l in f]
#
#fema = []
#
#for i in pa:
#
#    entry = []
#    for j in pa:
#        if i[0].strip() == j[0].strip():
#            print i, j
#            entry.append([j[0].strip(), j[2]])
#
#    if len(entry) == 1:
#        if entry[0] not in fema:
#            fema.append(entry[0])
#    elif len(entry) > 1:
#        town_funds = 0
#        for x in entry:
#            town_funds += float(x[1])
#        new_entry = [entry[0][0].strip(), town_funds]
#        if new_entry not in fema:
#            fema.append(new_entry)
#    else:
#        print 'huh!?'
#
#writer = csv.writer(open('../../Desktop/pa.csv', 'w'))
#writer.writerows(fema)


# for combining ihp and pa

#x = csv.reader(open('../../Dropbox/irene-csv/irene-funding.csv', 'rU'))
#
#y = csv.reader(open('../../Dropbox/irene-csv/pa.csv', 'rU'))
#
#irene = [l for l in x]
#pa = [l for l in y]
#
#for town in pa:
#    for child in irene:
#        if town[0] == child[0] and child[2] != 'TRUE':
#            child.append(town[1])
#            town.append('x')
#
#for i in pa:
#    if i[-1] != 'x':
#        entry = [0] * 15
#        entry[0] = i[0]
#        entry[14] = i[1]
#        irene.append(entry)
#
#writer = csv.writer(open('../../Dropbox/irene-csv/ihp-pa.csv', 'w'))
#writer.writerows(irene)


x = csv.reader(open('../../Dropbox/irene-csv/ihp-pa.csv', 'rU'))

fema = [l for l in x]

for town in fema:
    if town[2] == 'TRUE':
        pa = 0
        for i in fema:
            if town[0] == i[2]:
                if i[13]:
                    pa += float(i[13])
        town[13] = pa


writer = csv.writer(open('../../Dropbox/irene-csv/irene-fema-totals.csv', 'w'))
writer.writerows(fema)
