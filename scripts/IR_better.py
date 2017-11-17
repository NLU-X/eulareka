import sys
from heapq import nlargest
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from operator import itemgetter
from sklearn.metrics.pairwise import cosine_similarity
from nltk.util import ngrams
from nltk import word_tokenize, FreqDist
from nltk.corpus import stopwords
import string

stopwords = stopwords.words('english') + list(string.punctuation)

### Vocabulary in document
def load_vocab(file):
	dictio = {}
	with open(file,'r') as df :
		paragraphs = df.read().split('\n')

	for p in paragraphs :
		for word in p.split() :
			dictio[word] = 1
	return paragraphs, dictio.keys()


def getVectorTFIDF():
	cv_tfidf = TfidfVectorizer(vocabulary=vocab)
	train_set = []
	all_sentence = ''
	for p in paragraphs :
		all_sentence += (' ' + p)
		train_set.append(p)

	bigram = ngrams(all_sentence.split(), 2)
	return cv_tfidf, train_set, bigram

### Work on query
def clean (query):
	query = query.lower()
	clean_query = []
	for word in word_tokenize(query):
		if word not in stopwords:
			clean_query.append(word)
	return clean_query

def final_query_(query) :
	qu = clean(query)
	final_query = ''
	for i in range (0, len(qu)):
		if i == 0:
			ada = 0
			for key in keyN:
				if qu[i] == key[1] and fdist[key[1]] > 2:
					final_query += (' ' + " ".join(key))
					ada = 1
					break
			if ada == 0:
				final_query += (' ' + qu[i])

		if i==len(qu)-1:
			ada = 0
			for key in keyN:
				if qu[i] == key[0] and fdist[key[0]] > 2:
					final_query += (' ' + " ".join(key))
					ada = 1
					break
			if ada == 0:
				final_query += (' ' + qu[i])
		else:
			final_query += (' ' + qu[i])
	return final_query

### Search
def search(words, nRank = 7):
	score = {}
	final_query =final_query_(words)

	query_vector = cv_tfidf.fit_transform([final_query])
	res = cosine_similarity(query_vector, tfidf_matrix_train)

	i = 0
	for p in paragraphs :
		p = p.replace('\n', '')
		score[p] = res[0][i]
		i += 1

	rank = 1;
	for name, n in nlargest(50, score.iteritems(), key=itemgetter(1)):
		print name + '|' + str (n)
		rank += 1
		if rank > nRank:
			print ('\n')
			break



#### Run

if len(sys.argv) < 3:
    print "missing arguments"
    print "1. file"
    print "2. query"
    exit()

file = sys.argv[1]
query = sys.argv[2]

paragraphs, vocab = load_vocab(file)
cv_tfidf, train_set, bigram = getVectorTFIDF()
tfidf_matrix_train = cv_tfidf.fit_transform(train_set)

fdist = FreqDist(bigram)
keyN = sorted(fdist, key=fdist.get)

search(query)


# questions = ["What is the name of the software",
# "What is the name of the company",
# "Where is the headquarter of the company",
# "Who owns the software",
# "Who has the intellectual property of the software",
# "What are the terms of the license grant",
# "Is the product licensed or sold",
# "How long is the license",
# "How many downloads are authorized",
# "How long is the period of evaluation",
# "Is there a reverse engineering clause",
# "What are the restriction on use for users",# ("users are not permitted to")
# "Is there any related agreements", # (Terms and Conditions, or Privacy Policy, or Maintenance Policy)
# "Is your application collecting personal information from users", #(Privacy Policy URL)
# "Is there a termination of licensing",# (in case of violation of use or other issues)
# "Is there a Maintenance Policies",
# "What is the period of warranty",
# "What is the disclaimer of warranty", # ("AS IS" and/or "AS AVAILABLE")
# "Is it possible that the product will be updated regularly in the future",
# "For any material changes, what is the period of time that the company has to notice the user in advance",
# "Under the law of which jurisdiction this agreement is referring to ",
# "Is there a specific export information"
# ]
