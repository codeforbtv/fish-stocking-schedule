#!/usr/local/bin/python

import csv

def fish_index(row):
    """ This function is used by first_step() to create the new csv rows"""
    species = row[3]
    if row[7]:
        if species == 'BKT':
            x = [row[1], row[0], row[5], row[7], '','','','','','','','','','']
        elif species == 'LAT':
            x = [row[1], row[0],'','', row[5], row[7], '','','','','','','','']
        elif species == 'RBT':
            x = [row[1], row[0], '','','','', row[5], row[7], '','','','','','']
        elif species == 'STT':
            x = [row[1], row[0], '','','','','','',row[5], row[7], '','','','']
        elif species == 'BNT':
            x = [row[1], row[0], '','','','','','','','',row[5], row[7], '','']
        elif species == 'LAS':
            x = [row[1], row[0], '','','','','','','','','','', row[5], row[7] ]
        else:
            x = 'fail'
        return x
    else:
        pass

def create_rows():
    """Prior to this step, I used the excel "substitute' function to convert
    all town names with /, +, ' to', etc. to hyphens.
    This function creates the new csv rows and breaks multi-town entries
    into 2 (or 3), dividing the fish equally among towns"""

    f = csv.reader(open('data/fish-stocking1.csv', 'rU'))
    fish = [l for l in f]

    new_list = []
    multi_town = ['-', '+']
    for row in fish:
        if row[5]:
            x = False
            triple_town = False
            for i in range(len(row[1])):
                if row[1][i] in multi_town:
                    j = i + 1
                    x = row[1][:i]
                    y = row[1][j:]
                    multi_town_fish = int(row[5])/2
                    for h in range(len(y)):
                        if y[h] in multi_town:
                            triple_town = True
                            g = h + 1
                            z = y[:h]
                            w = y[g:]
                            multi_town_fish = int(row[5])/3
            if x:
                row[1] = x
                if triple_town:
                    row[5] = multi_town_fish
                    new_list.append(fish_index(row))
                    row[1] = z
                    new_list.append(fish_index(row))
                    row[1] = w
                    new_list.append(fish_index(row))
                else:
                    row[5] = multi_town_fish
                    new_list.append(fish_index(row))
                    row[1] = y
                    new_list.append(fish_index(row))
            else:
                new_list.append(fish_index(row))

    writer = csv.writer(open('data/fish-stocking-1.csv', 'w'))
    writer.writerows(new_list)

def combine_waterways():
    """This function creates one entry per town, per waterway, adding all of
    the fish totals and creating the new average"""

    f = csv.reader(open('data/fish-stocking1.csv', 'rU'))
    fish = [l for l in f]
    new_list = []

    for i in fish:
        town_water = [0]*14
        town_water[0] = i[0]
        town_water[1] = i[1]
        for j in fish:
            if i[0] == j[0] and i[1] == j[1]:
                for x in range(len(i)):
                    if x > 1 and j[x]:
                        if not x % 2:
                            num_fish = int(j[x])
                            town_water[x] += num_fish
                        else:
                            idx = x - 1
                            len_of_row = float(j[x]) * float(j[idx])
                            prev_len_of_fish = float(town_water[x]) * (float(town_water[idx])-float(j[idx]))
                            avg_len = (len_of_row + prev_len_of_fish) / float(town_water[idx])
                            town_water[x] = avg_len
        if town_water not in new_list:
            new_list.append(town_water)

    writer = csv.writer(open('data/fish-stocking2.csv', 'w'))
    writer.writerows(new_list)


def create_master():
    """Creates one 'master' entry per town, summing fish totals, ignoring length"""

    f = csv.reader(open('data/fish-stocking2.csv', 'rU'))
    fish = [l for l in f]

    new_list = []
    for row in fish:
        town_water = [0]*14
        town_water[1] = 'MASTER'
        town_water[0] = row[0]

        if town_water not in new_list:
            new_list.append(town_water)

    for row in fish:
        new_list.append(row)

    writer = csv.writer(open('data/fish-stocking3.csv', 'w'))
    writer.writerows(new_list)


def match_zipcode():
    """Matches fisheries data to vt.json zipcode data"""
    f = csv.reader(open('data/fish-stocking3.csv', 'rU'))
    fish = [l for l in f]

    z = csv.reader(open('data/vt-zipcode.csv', 'rU'))
    zips = [l for l in z]

    new_list = []
    for row in fish:
        row.insert(1, '')
        if row[2] == 'MASTER':
            for town in zips:
                if row[0].strip() == town[0]:
                    if town[1]:
                        row[1] = town[1]
                    elif town[0] == town[2]:
                        continue
                    else:
                        row[1] = town[2]
            new_list.append(row)
        else:
            new_list.append(row)

    writer = csv.writer(open('data/fish-stocking4.csv', 'w'))
    writer.writerows(new_list)

def make_parent():
    """Assigns a parent polygon to all child towns (which have multiple
    unique entries by watereway"""

    f = csv.reader(open('data/fish-stocking4.csv', 'rU'))
    fish = [l for l in f]

    new_list = []
    for row in fish:
        if row[2] != 'MASTER':
            for other in fish:
                if row[0] == other[0] and len(other[1]) != 4 and other[2] == 'MASTER':
                    row[1] = other[1]
                elif row[0] == other[0] and len(other[1]) == 4 and other[2] == 'MASTER':
                    row[1] = other[0]
            new_list.append(row)

    for row in fish:
        if row[2] == 'MASTER':
            idx = [3,5,7,9,11,13]
            for i in idx:
                row[i] = 0
            for other in fish:
                if row[0] == other[1]:
                    for i in idx:
                        if other[i]:
                            print other[0], other[i]
                            num_fish = int(other[i])
                            row[i] += num_fish
            total_fish = 0
            for i in idx:
                num_fish = int(row[i])
                total_fish += num_fish
            row.append(total_fish)
            print row
            new_list.append(row)

    writer = csv.writer(open('data/fish-stocking-final.csv', 'w'))
    writer.writerows(new_list)

def add_empty_zips():
    f = csv.reader(open('fish-stocking-final.csv', 'rU'))
    fish = [l for l in f]

    z = csv.reader(open('../data/vt-zipcode.csv', 'rU'))
    zips = [l for l in z]

    new_list = []
    zip_list = []
    for row in fish:
        new_list.append(row)
        if len(row[1]) == 4 and row[2] == 'MASTER':
            zip_list.append(row[1])

    for z in zips:
        if z[1] not in zip_list:
            if len(z[1]) == 4:
                new_list.append([z[0], z[1]])

    writer = csv.writer(open('fish-stocking-master.csv', 'w'))
    writer.writerows(new_list)

add_empty_zips()
