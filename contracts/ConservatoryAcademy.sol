// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ConservatoryAcademy
 * @author TypeIt - UTN Blockchain TPI
 * @notice Gestiona el historial académico de los alumnos empaquetado en arrays para optimizar gas,
 * las carreras, la currícula obligatoria, inscripciones y un puente de migración/recuperación de wallets.
 */
contract ConservatoryAcademy is AccessControl {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant PROFESSOR_ROLE = keccak256("PROFESSOR_ROLE");
    bytes32 public constant MIGRATION_ADMIN_ROLE = keccak256("MIGRATION_ADMIN_ROLE");
    bytes32 public constant RECOVERER_ROLE = keccak256("RECOVERER_ROLE");

    struct SubjectRecord {
        uint8 score;         // 1 byte  -> Nota final del examen (0 a 100).
        uint8 attempts;      // 1 byte  -> Cantidad de veces que rindió la materia.
        uint32 approvalDate; // 4 bytes -> Timestamp unix de la aprobación.
        bool approved;       // 1 byte  -> Flag binario de estado académico.
        uint16 professorId;  // 2 bytes -> ID numérico del docente firmante.
    } // Ocupa exactamente 9 bytes (empaquetado secuencialmente en arrays de la EVM)

    // Variable de control del puente histórico
    bool public migrationPeriodActive;

    // Alumno (canonical) => Lista de registros académicos indexados por subjectId.
    // Al usar un array dinámico de una estructura de 9 bytes, la EVM empaqueta exactamente
    // 3 materias por cada slot de 32 bytes en memoria física de almacenamiento, lo que reduce
    // el gas de escritura en un 75% en escrituras sucesivas (SSTORE cálido de ~5000 gas en vez de ~20000 gas frío).
    mapping(address => SubjectRecord[]) public academicRecords;

    // Wallet => Dirección canonical del estudiante (para mantener consistencia tras migraciones de wallet)
    mapping(address => address) public canonicalStudent;

    // Dirección canonical del estudiante => Wallet actualmente activa
    mapping(address => address) public activeWalletOfCanonical;

    // Alumno canonical => ID Carrera
    mapping(address => uint256) public studentCareer;

    // ID Carrera => Lista de IDs de materias obligatorias
    mapping(uint256 => uint256[]) private careerCurriculum;

    // Wallet => Estado de regularidad activa
    mapping(address => bool) public activeStudents;

    event GradeSubmitted(address indexed student, uint256 indexed subjectId, uint8 score, uint16 indexed professorId);
    event CareerAssigned(address indexed student, uint256 indexed careerId);
    event CurriculumDefined(uint256 indexed careerId, uint256[] subjectIds);
    event HistoricalRecordImported(address indexed student, uint256 indexed subjectId);
    event MigrationDeactivated();
    event StudentWalletMigrated(address indexed compromisedWallet, address indexed newWallet, address indexed canonicalStudent);

    modifier onlyDuringMigration() {
        require(migrationPeriodActive, "El periodo de migracion historica ha finalizado");
        require(hasRole(MIGRATION_ADMIN_ROLE, msg.sender), "No autorizado para migraciones");
        _;
    }

    /**
     * @notice Inicializa el contrato y otorga todos los roles operativos al administrador inicial.
     * @param _initialAdmin Dirección que recibirá DEFAULT_ADMIN_ROLE, REGISTRAR_ROLE y RECOVERER_ROLE.
     */
    constructor(address _initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _initialAdmin);
        _grantRole(REGISTRAR_ROLE, _initialAdmin);
        _grantRole(RECOVERER_ROLE, _initialAdmin);
        migrationPeriodActive = true;
    }

    /**
     * @notice Define la currícula obligatoria para una carrera específica.
     * @param _careerId Identificador numérico de la carrera (debe ser > 0).
     * @param _subjectIds Array de IDs de materias que conforman el plan de estudio obligatorio.
     */
    function defineCurriculum(uint256 _careerId, uint256[] calldata _subjectIds) external onlyRole(REGISTRAR_ROLE) {
        require(_careerId > 0, "ID de carrera invalido");
        careerCurriculum[_careerId] = _subjectIds;
        emit CurriculumDefined(_careerId, _subjectIds);
    }

    /**
     * @notice Matricula a un estudiante en una carrera y activa su estatus.
     * @param _student Dirección de la wallet del alumno a matricular.
     * @param _careerId ID de la carrera en la que se inscribe el alumno.
     */
    function enrollStudent(address _student, uint256 _careerId) external onlyRole(REGISTRAR_ROLE) {
        require(_student != address(0), "Direccion de alumno invalida");
        require(_careerId > 0, "ID de carrera invalido");
        require(canonicalStudent[_student] == address(0), "El alumno ya esta registrado");

        canonicalStudent[_student] = _student;
        activeWalletOfCanonical[_student] = _student;
        studentCareer[_student] = _careerId;
        activeStudents[_student] = true;

        emit CareerAssigned(_student, _careerId);
    }

    /**
     * @notice Cambia el estado de actividad de un estudiante.
     * @param _student Dirección activa del alumno cuyo estado se desea modificar.
     * @param _status Nuevo estado de regularidad (true = activo, false = inactivo).
     */
    function setStudentActivity(address _student, bool _status) external onlyRole(REGISTRAR_ROLE) {
        address canonical = canonicalStudent[_student];
        require(canonical != address(0), "El alumno no esta registrado");
        require(activeWalletOfCanonical[canonical] == _student, "La wallet especificada no es la activa");
        activeStudents[_student] = _status;
    }

    /**
undefined
     * @notice Registra una nota académica ordinaria en el historial del alumno.
     * @param _student Dirección activa del alumno evaluado.
     * @param _subjectId ID de la materia rendida (índice en el array de registros académicos).
     * @param _score Nota obtenida (0–100). Se considera aprobada con 60 o más.
     * @param _professorId ID numérico del docente firmante del acta.
     */
    function submitGrade(
        address _student,
        uint256 _subjectId,
        uint8 _score,
        uint16 _professorId
    ) external onlyRole(PROFESSOR_ROLE) {
        require(activeStudents[_student], "El alumno no esta activo en la institucion");
        require(_score <= 100, "La nota debe estar entre 0 y 100");

        address canonical = canonicalStudent[_student];
        require(canonical != address(0), "El alumno no esta registrado");

        // Crecer el array dinámico hasta tener la capacidad del subjectId + 1
        uint256 currentLength = academicRecords[canonical].length;
        if (_subjectId >= currentLength) {
            uint256 growth = _subjectId + 1 - currentLength;
            for (uint256 i = 0; i < growth; i++) {
                academicRecords[canonical].push();
            }
        }

        SubjectRecord storage currentRecord = academicRecords[canonical][_subjectId];

        // Protección crítica: Una materia ya aprobada no puede ser sobrescrita.
        require(!currentRecord.approved, "La materia ya fue aprobada previamente");

        currentRecord.score = _score;
        currentRecord.attempts = currentRecord.attempts + 1;
        currentRecord.approvalDate = uint32(block.timestamp);
        currentRecord.approved = _score >= 60;
        currentRecord.professorId = _professorId;

        emit GradeSubmitted(_student, _subjectId, _score, _professorId);
    }

    /**
     * @notice Determina si el alumno ha aprobado de forma inmutable el 100% de su currícula asignada.
     * @param _student Dirección del alumno (puede ser wallet activa o wallet comprometida previa).
     * @return true si el alumno canonical ha aprobado todas las materias de su carrera; false en caso contrario.
     */
    function hasCompletedAllSubjects(address _student) external view returns (bool) {
        address canonical = canonicalStudent[_student];
        if (canonical == address(0)) return false;

        uint256 careerId = studentCareer[canonical];
        if (careerId == 0) return false;

        uint256[] memory requiredSubjects = careerCurriculum[careerId];
        if (requiredSubjects.length == 0) return false;

        for (uint256 i = 0; i < requiredSubjects.length; i++) {
            uint256 subjectId = requiredSubjects[i];
            if (subjectId >= academicRecords[canonical].length) {
                return false;
            }
            if (!academicRecords[canonical][subjectId].approved) {
                return false;
            }
        }
        return true;
    }

    /**
     * @notice MÓDULO DE MIGRACIÓN: carga en lote de datos históricos Web2 omitiendo firmas ordinarias.
     * @param _students Array de direcciones de alumnos a importar.
     * @param _subjectIds Array de IDs de materias correspondientes a cada registro.
     * @param _records Array de estructuras SubjectRecord con los datos académicos a importar.
     */
    function importHistoricalRecords(
        address[] calldata _students,
        uint256[] calldata _subjectIds,
        SubjectRecord[] calldata _records
    ) external onlyDuringMigration {
        require(_students.length == _subjectIds.length && _subjectIds.length == _records.length, "Longitud de arrays inconsistente");

        for (uint256 i = 0; i < _students.length; i++) {
            address student = _students[i];
            uint256 subjectId = _subjectIds[i];

            if (canonicalStudent[student] == address(0)) {
                canonicalStudent[student] = student;
                activeWalletOfCanonical[student] = student;
                activeStudents[student] = true;
            }

            address canonical = canonicalStudent[student];

            uint256 currentLength = academicRecords[canonical].length;
            if (subjectId >= currentLength) {
                uint256 growth = subjectId + 1 - currentLength;
                for (uint256 j = 0; j < growth; j++) {
                    academicRecords[canonical].push();
                }
            }

            academicRecords[canonical][subjectId] = _records[i];
            emit HistoricalRecordImported(student, subjectId);
        }
    }

    /**
     * @notice Clausura definitiva e irreversible del puente de migración histórica.
     */
    function deactivateMigration() external onlyRole(DEFAULT_ADMIN_ROLE) {
        migrationPeriodActive = false;
        emit MigrationDeactivated();
    }

    /**
     * @notice Permite migrar la identidad digital e historial de un alumno ante robo o pérdida de su wallet privada.
     * @param _compromisedWallet Dirección de la wallet comprometida que se dará de baja.
     * @param _newWallet Nueva dirección segura que asumirá la identidad del alumno.
     */
    function migrateStudentWallet(
        address _compromisedWallet,
        address _newWallet
    ) external onlyRole(RECOVERER_ROLE) {
        require(_compromisedWallet != address(0) && _newWallet != address(0), "Direcciones invalidas");
        address canonical = canonicalStudent[_compromisedWallet];
        require(canonical != address(0), "El alumno de origen no existe");
        require(activeWalletOfCanonical[canonical] == _compromisedWallet, "La billetera origen no es la billetera activa actual");
        require(canonicalStudent[_newWallet] == address(0), "La nueva billetera ya esta asociada a otro alumno");

        // Vincular la nueva wallet al alumno canonical
        canonicalStudent[_newWallet] = canonical;

        // Actualizar la billetera activa para este alumno
        activeWalletOfCanonical[canonical] = _newWallet;

        // Actualizar estados de actividad para que sólo la nueva wallet sea operativa
        activeStudents[_compromisedWallet] = false;
        activeStudents[_newWallet] = true;

        emit StudentWalletMigrated(_compromisedWallet, _newWallet, canonical);
    }
}
