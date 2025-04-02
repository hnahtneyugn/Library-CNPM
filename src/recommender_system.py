# import numpy as np
# import pandas as pd
# from scipy import sparse
# from src.crud import recommendation_crud


# class CollaborativeFiltering(object):
#     def __init__(self):
#         self.utility_matrix = recommendation_crud.get_utility_matrix()
#         self.similarity = recommendation_crud.get_similarity()

#     def add(self, new_data):
#         pass

#     def normalize(self):
#         pass

#     def update(self):
#         pass

#     def predict(self, user, book):
#         pass

#     def recommend(self, user):
#         pass


# class UtilityMatrix(Model):
#     user = fields.IntField(pk=True)
#     book = fields.IntField(pk=True)
#     value = fields.FloatField()

#     class Meta:
#         table = 'utility_matrix'


# class Similarity(Model):
#     user1 = fields.IntField(pk=True)
#     user2 = fields.IntField(pk=True)
#     value = fields.FloatField()

#     class Meta:
#         table = 'similarity'
