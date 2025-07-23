def read_file(file_path):
    """Read the contents of a file and return it as a string."""
    with open(file_path, 'r') as file:
        return file.read()

if __name__  == "__main__":
    file_path = 'guest_list.txt'
    guests = read_file(file_path)
    print("Guest List:")
    print(guests)