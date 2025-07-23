def read_file(file_path):
    """Read the contents of a file and return it as a string."""
    with open(file_path, 'r') as file:
        return file.read()

def write_file(file_path, content):
    """Write the given content to a file."""
    with open(file_path, 'a') as file:
        file.write(f"\n{content}")

if __name__  == "__main__":
    new_guest = "Naomi"
    file_path = 'guest_list.txt'

    write_file('guest_list.txt', new_guest)
    print(f"Added new guest: {new_guest}")
    
    guests = read_file(file_path)
    print("Guest List:")
    print(guests)