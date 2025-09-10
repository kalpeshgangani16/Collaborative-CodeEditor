const languageTemplates = {
  63: `// JavaScript (Node.js)
console.log("Hello World");`,

  71: `# Python 3
print("Hello World")`,

  62: `// Java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`,

  54: `// C++
#include <iostream>
using namespace std;
int main() {
    cout << "Hello World" << endl;
    return 0;
}`,

  50: `// C
#include <stdio.h>
int main() {
    printf("Hello World\\n");
    return 0;
}`
};

export default languageTemplates;
