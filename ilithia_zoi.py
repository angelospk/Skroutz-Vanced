import statistics as s
import random

a=[2,2,1,2,1,2,3,1,1,1,1,3,1,3,2,1,3,2,1,1,2,2,3,2,1,1,2,1,2,1,2,2,1,2,2,1,3,1,1,1,2,2,3,2,1,1,2,3,2,2,1,3,1,3,2,2,1,3,3,1,2,2,2,2,2,1,2,2,1]
min_goal=1.82

std_goal=0.696
n_goal=55
def getStats(li):
  return round(s.mean(li),2), round(s.stdev(li),3)
m, st= getStats(a)
final=[]
while abs(m-min_goal)!=0 or abs(st-std_goal)!=0:
  b=a.copy()
  for i in range(0,len(a)-n_goal):
    # get random index and delete it from list
    index = random.randint(0, len(b) - 1)
    del b[index]
  final=b
  m,st=getStats(b)
  print(m,st)
print(final)