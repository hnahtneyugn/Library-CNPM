# import tortoise.transactions
# from src.models import *
# from src.openlibrary_service import *
# from src.schemas import *
# from tortoise.exceptions import DoesNotExist
# import tortoise
# import numpy as np
# import scipy.sparse as sp


# async def get_utility_matrix():
#     """Get the utility matrix from database
#     """

#     utility_matrix = await UtilityMatrix.all().values_list('user', 'book', 'value')
#     data = np.array(utility_matrix, dtype=np.int32)
#     rows, cols, values = data[:, 0], data[:, 1], data[:, 2]
#     sparse_matrix = sp.csr_array((values, (rows, cols)))
#     return sparse_matrix


# async def get_similarity():
#     """Get the similarity matrix from database
#     """

#     similarity = await Similarity.all().values('user1', 'user2', 'value')
#     data = np.array(similarity, dtype=np.int32)
#     rows, cols, values = data[:, 0], data[:, 1], data[:, 2]
#     sparse_matrix = sp.csr_array((values, (rows, cols)))
#     return sparse_matrix


# async def create_or_update_recommender(new_data):
#     """Update the similarity and utility matrix, or create new instance if not exists

#     Args:
#         new_data (a list): the new data to be updated or created
#     """

#     pass
